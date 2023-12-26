import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import Logger from 'bunyan';

import {
	ICommentDocument,
	ICommentNameList
} from '@comments/interfaces/comment.interface';
import { CommentCache } from '@service/redis/comment.cache';
import { Request, Response } from 'express';
import { config } from '@root/config';
import { commentService } from '@service/db/comment.service';

const log: Logger = config.createLogger('GetComment');

const commentCache: CommentCache = new CommentCache();

export class Get {
	public async comments(req: Request, res: Response): Promise<void> {
		const { postId } = req.params;

		// RETRIVED COMMENTS FROM CACHE
		const cachedComments: ICommentDocument[] =
			await commentCache.getPostCommentsFromCache(postId);

		// RETRIVE COMMENTS FROM DATABASE IF NOT AVAILABLE IN CACHE
		const comments: ICommentDocument[] = cachedComments.length
			? await commentService.getPostCommentsFromDB(
					{ postId: new mongoose.Types.ObjectId(postId) },
					{ createdAt: -1 }
			  )
			: cachedComments;

		res.status(HTTP_STATUS.OK).json({
			comments: comments,
			message: 'All Post Comment Retrived Successfully.'
		});
	}

	public async commentsNameFromCache(req: Request, res: Response): Promise<void> {
		const { postId } = req.params;

		// RETRIVED COMMENTS NAME FROM CACHE
		const cachedComments: ICommentNameList[] =
			await commentCache.getCommentNamesFromCache(postId);

		// RETRIVE COMMENTS NAME FROM DATABASE IF NOT AVAILABLE IN CACHE
		const comments: ICommentNameList[] = cachedComments.length
			? await commentService.getPostCommentNamesFromDB(
					{ postId: new mongoose.Types.ObjectId(postId) },
					{ createdAt: -1 }
			  )
			: cachedComments;

		res.status(HTTP_STATUS.OK).json({
			comments: comments,
			message: 'Post Comment Names Retrived Successfully.'
		});
	}

	public async singleComment(req: Request, res: Response): Promise<void> {
		const { postId, commentId } = req.params;

		// RETRIVED COMMENT FROM CACHE
		const cachedComments: ICommentDocument[] =
			await commentCache.getSingleCommentFromCache(postId, commentId);

		// RETRIVE COMMENT FROM DATABASE IF NOT AVAILABLE IN CACHE
		const comments: ICommentDocument[] = cachedComments
			? await commentService.getPostCommentsFromDB(
					{
						_id: new mongoose.Types.ObjectId(commentId)
					},
					{ createdAt: -1 }
			  )
			: cachedComments;

		res.status(HTTP_STATUS.OK).json({
			comments: comments[0],
			message: 'Single Post Comment Retrived Successfully.'
		});
	}
}
