import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';
import { ConnectionCache } from '@service/redis/connection.cache';
import { connectionQueue } from '@service/queues/connection.queue';

const connectionCache: ConnectionCache = new ConnectionCache();

export class Remove {
	public async follower(req: Request, res: Response): Promise<void> {
		const { followeeId, followerId } = req.params;

		const removeFollowerFromCache: Promise<void> =
			connectionCache.removeFollowerFromCache(
				`following:${req.currentUser?.userId}`,
				`${followeeId}`
			);

		const removeFolloweeFromCache: Promise<void> =
			connectionCache.removeFollowerFromCache(
				`followers:${followeeId}`,
				`${followerId}`
			);

		const follwersCount: Promise<void> = connectionCache.updateConnectionCountInCache(
			`${followeeId}`,
			'followersCount',
			-1
		);

		const follweeCount: Promise<void> = connectionCache.updateConnectionCountInCache(
			`${req.currentUser?.userId}`,
			'followingCount',
			-1
		);

		await Promise.all([
			removeFollowerFromCache,
			removeFolloweeFromCache,
			follwersCount,
			follweeCount
		]);

		// SEND DATA TO QUEUE
		connectionQueue.removeConnectionJob('removeConnectionFromDB', {
			keyOne: `${req.currentUser?.userId}`,
			keyTwo: `${followerId}`
		});

		res.status(HTTP_STATUS.OK).json({
			message: 'UnFollowed user successfully.'
		});
	}
}
