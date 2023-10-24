import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

import { postQueue } from '@service/queues/post.queue';
import { PostCache } from '@service/redis/post.cache';
import { socketIOPostObject } from '@socket/post';

const postCache: PostCache = new PostCache();

export class Delete {
	public async post(req: Request, res: Response): Promise<void> {
		// Emit new socket event
		socketIOPostObject.emit('delete post', req.params.postId);

		// Delete post from cache
		await postCache.deletePostFromCache(
			req.params.postId,
			`${req.currentUser?.userId}`
		);

		// Delete post from DB
		postQueue.addPostJob('deletePostFromDB', {
			keyOne: req.params.postId,
			keyTwo: req.currentUser?.userId
		});

		res.status(HTTP_STATUS.OK).json({ message: 'Post Deleted Successfully' });
	}
}
