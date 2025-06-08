import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import {
	postSchema,
	postWithImageSchema,
	postWithVideoSchema
} from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { BadRequestError } from '@global/helpers/error_handler';
import { UploadApiResponse } from 'cloudinary';
import { uploads, videoUpload } from '@global/helpers/cloudinaryUpload';
import { imageQueue } from '@service/queues/image.queue';

const postCache: PostCache = new PostCache();

export class Update {
	// POST WITHOUT IMAGE
	@joiValidation(postSchema)
	public async post(req: Request, res: Response): Promise<void> {
		// Destructure updatedPost from request body
		const {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			profilePicture
		} = req.body;

		const { postId } = req.params;

		const updatedPost: IPostDocument = {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			profilePicture
		} as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });

		res.status(HTTP_STATUS.OK).json({ message: 'Post Updated Successfully' });
	}

	// POST WITH IMAGE
	@joiValidation(postWithImageSchema)
	public async postWithImage(req: Request, res: Response): Promise<void> {
		// Destructure updatedPost from request body
		const { imgVersion, imgId } = req.body;

		const { postId } = req.params;

		// IF ITS THE SAME IMAGE
		if (imgVersion && imgId) {
			Update.prototype.updatePostWithImage(req);
		}
		// NEW IMAGE PASSED IN BODY
		else {
			const result: UploadApiResponse =
				await Update.prototype.addImageToExisitingPost(req);

			if (!result.public_id) {
				throw new BadRequestError(result.message);
			}
		}

		const updatedPost: IPostDocument = {
			imgVersion,
			imgId
		} as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });

		res.status(HTTP_STATUS.OK).json({
			message: 'Post With Image Updated Successfully'
		});
	}

	private async updatePostWithImage(req: Request): Promise<void> {
		// Destructure updatedPost from request body
		const {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			profilePicture
		} = req.body;

		const { postId } = req.params;

		const updatedPost: IPostDocument = {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			profilePicture
		} as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
	}

	private async addImageToExisitingPost(req: Request): Promise<UploadApiResponse> {
		// Destructure updatedPost from request body
		const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image } =
			req.body;

		const { postId } = req.params;

		// UPLOAD IMAGE TO CLOUDINARY
		const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

		if (!result?.public_id) {
			return result;
		}

		const updatedPost: IPostDocument = {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			profilePicture,
			// NEW UPLOADED IMAGE ID & VERSION
			imgId: result.public_id,
			imgVersion: result.image_version.toString()
		} as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });

		if (image) {
			imageQueue.addImageJob('addImageToDB', {
				key: `${req.currentUser!.userId}`,
				imgId: result.public_id,
				imgVersion: result.version.toString()
			});
		}

		return result;
	}

	@joiValidation(postWithVideoSchema)
	public async postWithVideo(req: Request, res: Response): Promise<void> {
		const { videoId, videoVersion } = req.body;

		if (videoId && videoVersion) {
			Update.prototype.updatePost(req);
		} else {
			const result: UploadApiResponse =
				await Update.prototype.addImageToExistingPost(req);

			if (!result.public_id) {
				throw new BadRequestError(result.message);
			}
		}
		res.status(HTTP_STATUS.OK).json({
			message: 'Post with video updated successfully'
		});
	}

	private async updatePost(req: Request): Promise<void> {
		const {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			profilePicture,
			videoId,
			videoVersion
		} = req.body;

		const { postId } = req.params;

		const updatedPost: IPostDocument = {
			post,
			bgColor,
			privacy,
			feelings,
			gifUrl,
			profilePicture,
			imgId: imgId ? imgId : '',
			imgVersion: imgVersion ? imgVersion : '',
			videoId: videoId ? videoId : '',
			videoVersion: videoVersion ? videoVersion : ''
		} as unknown as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });
	}

	private async addImageToExistingPost(req: Request): Promise<UploadApiResponse> {
		const { post, bgColor, feelings, privacy, gifUrl, profilePicture, image, video } =
			req.body;

		const { postId } = req.params;

		const result: UploadApiResponse = image
			? ((await uploads(image)) as UploadApiResponse)
			: ((await videoUpload(video)) as UploadApiResponse);

		if (!result?.public_id) {
			return result;
		}

		const updatedPost: IPostDocument = {
			post,
			bgColor,
			privacy,
			feelings,
			gifUrl,
			profilePicture,
			imgId: image ? result.public_id : '',
			imgVersion: image ? result.version.toString() : '',
			videoId: video ? result.public_id : '',
			videoVersion: video ? result.version.toString() : ''
		} as unknown as IPostDocument;

		const postUpdated: IPostDocument = await postCache.updatePostInCache(
			postId,
			updatedPost
		);

		socketIOPostObject.emit('update post', postUpdated, 'posts');

		postQueue.addPostJob('updatePostInDB', { key: postId, value: postUpdated });

		if (image) {
			imageQueue.addImageJob('addImageToDB', {
				key: `${req.currentUser!.userId}`,
				imgId: result.public_id,
				imgVersion: result.version.toString()
			});
		}
		return result;
	}
}
