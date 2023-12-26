import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';

import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { CommentCache } from '@service/redis/comment.cache';
import { addCommentSchema } from '@comments/schemes/comment';
import { ICommentDocument, ICommentJob } from '@comments/interfaces/comment.interface';
import { commentQueue } from '@service/queues/comment.queue';
import { config } from '@root/config';

const log: Logger = config.createLogger('AddComment');

const commentCache: CommentCache = new CommentCache();

export class Add {
	@joiValidation(addCommentSchema)
	public async comment(req: Request, res: Response): Promise<void> {
		const { postId, comment, userTo, profilePicture } = req.body;

		const commentObjectID: ObjectId = new ObjectId();

		// CREATING COMMENT OBJECT TO SAVE IN CACHE
		const commentData: ICommentDocument = {
			_id: commentObjectID,
			postId,
			comment,
			userTo,
			profilePicture,
			username: `${req.currentUser?.username}`,
			avatarColor: `${req.currentUser?.avatarColor}`,
			createdAt: new Date()
		} as ICommentDocument;

		// SAVE COMMENT IN CACHE
		await commentCache.savePostCommentToCache(postId, JSON.stringify(commentData));

		// CREATING COMMENT OBJ TO SAVE IN DB
		const databaseCommentData: ICommentJob = {
			postId,
			userTo,
			userFrom: req.currentUser!.userId,
			username: req.currentUser!.username,
			comment: commentData
		};

		// ADDING IT INTO THE QUEUE
		commentQueue.addCommentJob('addCommentToDB', databaseCommentData);

		res.status(HTTP_STATUS.OK).json({ message: 'Comment Added Successfully.' });
	}
}
