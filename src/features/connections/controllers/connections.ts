import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ConnectionCache } from '@service/redis/connection.cache';
import { IFollower, IFollowerData } from '@connections/interfaces/connections.interface';
import { connectionService } from '@service/db/connection.service';
import { connectionQueue } from '@service/queues/connection.queue';

const connectionCache: ConnectionCache = new ConnectionCache();

export class Connection {
	async getUserFollowings(req: Request, res: Response): Promise<void> {
		const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.currentUser!.userId);

		const cachedUserFollowees: IFollowerData[] =
			await connectionCache.getFollowersFromCache(
				`following:${req.currentUser!.userId}`
			);

		const followings: IFollower[] | IFollowerData[] = cachedUserFollowees.length
			? cachedUserFollowees
			: await connectionService.getFolloweeData(userObjectId);

		res.status(HTTP_STATUS.OK).json({
			message: 'User Followings',
			followings: followings
		});
	}

	async getUserFollowers(req: Request, res: Response): Promise<void> {
		const userObjectId: ObjectId = new mongoose.Types.ObjectId(req.params.userId);

		const cachedUserFollowers: IFollowerData[] =
			await connectionCache.getFollowersFromCache(`followers:${userObjectId}`);

		const followers: IFollower[] | IFollowerData[] = cachedUserFollowers.length
			? cachedUserFollowers
			: await connectionService.getFollowerData(userObjectId);

		res.status(HTTP_STATUS.OK).json({
			message: 'User Followers',
			followers: followers
		});
	}

	async blockUser(req: Request, res: Response) {
		const { followerId } = req.params;

		Connection.prototype.updateBlockedUser(
			followerId,
			req.currentUser!.userId,
			'block'
		);

		connectionQueue.addChangeBlockStatusJob('changeBlockStatusInDB', {
			keyOne: `${req.currentUser!.userId}`,
			keyTwo: `${followerId}`,
			type: 'block'
		});

		res.status(HTTP_STATUS.OK).json({ message: 'User blocked successfully' });
	}

	async unBlockUser(req: Request, res: Response) {
		const { followerId } = req.params;

		Connection.prototype.updateBlockedUser(
			followerId,
			req.currentUser!.userId,
			'unblock'
		);

		connectionQueue.addChangeBlockStatusJob('changeUnBlockStatusInDB', {
			keyOne: `${req.currentUser!.userId}`,
			keyTwo: `${followerId}`,
			type: 'unblock'
		});

		res.status(HTTP_STATUS.OK).json({ message: 'User Unblocked successfully' });
	}

	private async updateBlockedUser(
		followerId: string,
		userId: string,
		type: 'block' | 'unblock'
	): Promise<void> {
		const blocked: Promise<void> = connectionCache.updateBlockedUserPropInCache(
			`${userId}`,
			'blocked',
			`${followerId}`,
			type
		);

		const blockedBy: Promise<void> = connectionCache.updateBlockedUserPropInCache(
			`${followerId}`,
			'blockedBy',
			`${userId}`,
			type
		);

		await Promise.all([blocked, blockedBy]);
	}
}
