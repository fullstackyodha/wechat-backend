import { IFileImageDocument } from '@images/interfaces/image.interface';
import { ImageModel } from '@images/models/image.schema';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';

class ImageService {
	public async addUserProfileImageToDB(
		userId: string,
		url: string,
		imgId: string,
		imgVersion: string
	): Promise<void> {
		await UserModel.updateOne(
			{ _id: userId },
			{ $set: { profilePictureUrl: url } }
		).exec();

		await this.addImage(userId, 'profile', imgId, imgVersion);
	}

	public async addUserBackgroundImageToDB(
		userId: string,
		imgId: string,
		imgVersion: string
	): Promise<void> {
		await UserModel.updateOne(
			{ _id: userId },
			{ $set: { bgImageId: imgId, bgImageVersion: imgVersion } }
		).exec();

		await this.addImage(userId, 'background', imgId, imgVersion);
	}

	public async addImage(
		userId: string,
		type: string,
		imgId: string,
		imgVersion: string
	): Promise<void> {
		await ImageModel.create({
			userId,
			bgImageVersion: type === 'background' ? imgVersion : '',
			bgImageId: type === 'background' ? imgId : '',
			imgVersion,
			imgId
		});
	}

	public async removeImageFromDB(imageId: string): Promise<void> {
		await ImageModel.deleteOne({ _id: imageId }).exec();
	}

	public async getImageByBackgroundId(bgImageId: string): Promise<IFileImageDocument> {
		const image: IFileImageDocument = (await ImageModel.findOne({
			bgImageId
		}).exec()) as IFileImageDocument;

		return image;
	}

	public async getImages(userId: string): Promise<IFileImageDocument[]> {
		const image: IFileImageDocument[] = await ImageModel.aggregate([
			{
				$match: {
					userId: new mongoose.Types.ObjectId(userId)
				}
			}
		]);

		return image;
	}
}

export const imageService: ImageService = new ImageService();
