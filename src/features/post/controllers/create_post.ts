import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { postSchema, postWithImageSchema } from '@post/schemes/post.schemes';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@service/redis/post.cache';
import Logger from 'bunyan';
import { socketIOPostObject } from '@socket/post';
import { postQueue } from '@service/queues/post.queue';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { UploadApiResponse } from 'cloudinary';
import { BadRequestError } from '@global/helpers/error_handler';
import { imageQueue } from '@service/queues/image.queue';

const log: Logger = config.createLogger('post');

const postCache: PostCache = new PostCache();

export class Create {
	// ADD POST WITHOUT IMAGE
	@joiValidation(postSchema)
	public async post(req: Request, res: Response): Promise<void> {
		const { post, bgColor, privacy, feelings, gifUrl, profilePicture } = req.body;

		const postObjectId: ObjectId = new ObjectId();

		const createdPost: IPostDocument = {
			_id: postObjectId,
			userId: req.currentUser!.userId,
			username: req.currentUser!.username,
			email: req.currentUser!.email,
			avatarColor: req.currentUser!.avatarColor,
			post,
			bgColor,
			privacy,
			feelings,
			gifUrl,
			profilePicture,
			commentsCount: 0,
			imgVersion: '',
			imgId: '',
			createdAt: new Date(),
			reactions: { like: 0, love: 0, happy: 0, wow: 0, sad: 0, angry: 0 }
		} as IPostDocument;

		// SAVE POST TO THE POST CACHE
		await postCache.savePostToCache({
			key: postObjectId,
			currentUserId: `${req.currentUser!.userId}`,
			uId: `${req.currentUser!.uId}`,
			createdPost
		});

		// Emits an event. (event name, value)
		socketIOPostObject.emit('addPost', createdPost);

		// ADD CREATED POST TO THE QUEUE WITH USER ID
		postQueue.addPostJob('addPostToDB', {
			key: req.currentUser!.userId,
			value: createdPost
		});

		// SEND RESPONSE
		res.status(HTTP_STATUS.OK).json({ message: 'Post created successfully!!!' });
	}

	// ******ADD POST WITH IMAGE******
	@joiValidation(postWithImageSchema)
	public async postWithImage(req: Request, res: Response): Promise<void> {
		const { image, post, bgColor, privacy, feelings, gifUrl, profilePicture } =
			req.body;

		// UPLOAD AVATAR IMAGE TO CLOUDINARY
		const result: UploadApiResponse = (await uploads(image)) as UploadApiResponse;

		if (!result?.public_id) {
			throw new BadRequestError(result.message);
		}

		const postObjectId: ObjectId = new ObjectId();

		const createdPost: IPostDocument = {
			_id: postObjectId,
			userId: req.currentUser!.userId,
			username: req.currentUser!.username,
			email: req.currentUser!.email,
			avatarColor: req.currentUser!.avatarColor,
			post,
			bgColor,
			privacy,
			feelings,
			gifUrl,
			profilePicture,
			commentsCount: 0,
			imgVersion: result.version.toString(),
			imgId: result.public_id,
			createdAt: new Date(),
			reactions: { like: 0, love: 0, happy: 0, wow: 0, sad: 0, angry: 0 }
		} as IPostDocument;

		// SAVE POST TO THE POST CACHE
		await postCache.savePostToCache({
			key: postObjectId,
			currentUserId: `${req.currentUser!.userId}`,
			uId: `${req.currentUser!.uId}`,
			createdPost
		});

		// Emits an event. (event name, value)
		socketIOPostObject.emit('addPost', createdPost);

		// ADD CREATED POST TO THE QUEUE WITH USER ID
		postQueue.addPostJob('addPostToDB', {
			key: req.currentUser!.userId,
			value: createdPost
		});

		imageQueue.addImageJob('addImageToDB', {
			key: req.currentUser!.userId,
			imgId: result?.public_id,
			imgVersion: result.version.toString()
		});

		// ADD POST DATA TO THE QUEUE
		res.status(HTTP_STATUS.OK).json({
			message: 'Post with image created successfully!!!'
		});
	}
}
