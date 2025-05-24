import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { BadRequestError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import {
	IBgUploadResponse,
	IFileImageDocument
} from '@images/interfaces/image.interface';
import { addImageScheme } from '@images/schemes/images.schemes';
import { config } from '@root/config';
import { imageService } from '@service/db/image.service';
import { imageQueue } from '@service/queues/image.queue';
import { UserCache } from '@service/redis/user.cache';
import { socketIOImageObject } from '@socket/image';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class Images {
	public async getImages(req: Request, res: Response): Promise<void> {
		const { userId } = req.params;

		const images: IFileImageDocument[] = await imageService.getImages(userId);

		res.status(HTTP_STATUS.CREATED).json({
			message: 'User Images.',
			images
		});
	}

	@joiValidation(addImageScheme)
	public async addProfileImage(req: Request, res: Response): Promise<void> {
		const { image } = req.body;

		const result: UploadApiResponse = (await uploads(
			image,
			req.currentUser!.userId, // https://res.cloudinary.com/123/${userObjectId}
			true,
			true
		)) as UploadApiResponse;

		if (!result?.public_id) {
			throw new BadRequestError('File upload: Error occured. Try again!!!');
		}

		const url = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;

		const cachedUser: IUserDocument | null =
			(await userCache.updateSingleUserItemInCache(
				`${req.currentUser!.userId}`,
				'profilePicture',
				url
			)) as IUserDocument | null;

		socketIOImageObject.emit('update user', cachedUser);

		imageQueue.addImageJob('addUserProfileImageToDB', {
			key: `${req.currentUser!.userId}`,
			value: url,
			imgId: result.public_id,
			imgVersion: result.image_version.toString()
		});

		res.status(HTTP_STATUS.CREATED).json({
			message: 'Profile Image add Successfully!!!'
		});
	}

	@joiValidation(addImageScheme)
	public async addBackgroundImage(req: Request, res: Response): Promise<void> {
		const { image } = req.body;

		const { version, publicId }: IBgUploadResponse =
			await Images.prototype.backgroundImageUpload(image);

		const bgImageId: Promise<IUserDocument | null> =
			userCache.updateSingleUserItemInCache(
				`${req.currentUser!.userId}`,
				'bgImageId',
				publicId
			);

		const bgImageVersion: Promise<IUserDocument | null> =
			userCache.updateSingleUserItemInCache(
				`${req.currentUser!.userId}`,
				'bgImageVersion',
				version
			);

		const response: [IUserDocument | null, IUserDocument | null] = await Promise.all([
			bgImageId,
			bgImageVersion
		]);

		socketIOImageObject.emit('update user', {
			bgImageId: publicId,
			bgImageVersion: version,
			userId: response[0]
		});

		imageQueue.addImageJob('updateBgImageToDB', {
			key: `${req.currentUser!.userId}`,
			imgId: publicId,
			imgVersion: version.toString()
		});

		res.status(HTTP_STATUS.CREATED).json({
			message: 'Background Image add Successfully!!!'
		});
	}

	public async deleteImage(req: Request, res: Response): Promise<void> {
		const { imageId } = req.params;

		socketIOImageObject.emit('delete image', imageId);

		imageQueue.addImageJob('removeImageFromDB', {
			imageId
		});

		res.status(HTTP_STATUS.CREATED).json({
			message: 'Image deleted Successfully!!!'
		});
	}

	public async deleteBackgroundImage(req: Request, res: Response): Promise<void> {
		const { bgImageId } = req.params;

		const image: IFileImageDocument =
			await imageService.getImageByBackgroundId(bgImageId);

		socketIOImageObject.emit('delete image', image._id);

		const bgImgId: Promise<IUserDocument | null> =
			userCache.updateSingleUserItemInCache(
				`${req.currentUser!.userId}`,
				'bgImageId',
				''
			);

		const bgImageVersion: Promise<IUserDocument | null> =
			userCache.updateSingleUserItemInCache(
				`${req.currentUser!.userId}`,
				'bgImageVersion',
				''
			);

		await Promise.all([bgImgId, bgImageVersion]);

		imageQueue.addImageJob('removeImageFromDB', {
			imageId: image._id
		});

		res.status(HTTP_STATUS.CREATED).json({
			message: 'Background Image deleted Successfully!!!'
		});
	}

	private async backgroundImageUpload(image: string): Promise<IBgUploadResponse> {
		const isDatatUrl = Helpers.isDataURL(image);

		let version = '',
			publicId = '';

		if (isDatatUrl) {
			const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

			if (!result?.public_id) {
				throw new BadRequestError('File upload: Error occured. Try again!!!');
			} else {
				version = result.version.toString();
				publicId = result.public_id;
			}
		} else {
			const value = image.split('/');

			version = value[value.length - 2].replace(/v/g, '');
			publicId = value[value.length - 1];
		}

		return { version, publicId };
	}
}
