import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { ConnectionCache } from '@service/redis/connection.cache';
import { IFollower, IFollowerData } from '@connections/interfaces/connections.interface';
import { connectionService } from '@service/db/connection.service';

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
}
