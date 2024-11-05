import HTTP_STATUS from 'http-status-codes';
import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { ConnectionCache } from '@service/redis/connection.cache';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { IFollowerData } from '@connections/interfaces/connections.interface';
import { socketIOConnectionObject } from '@socket/connection';
import mongoose from 'mongoose';
import { userService } from '@service/db/user.service';
import { connectionQueue } from '@service/queues/connection.queue';

const connectionCache: ConnectionCache = new ConnectionCache();
const userCache: UserCache = new UserCache();

export class Add {
	public async follower(req: Request, res: Response): Promise<void> {
		const { followerId } = req.params;

		const user: IUserDocument = await userService.getUserById(followerId);

		if (!user) {
			res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'User not found' });
		}

		// UPDATE FOLLOWER COUNT IN CACHE
		const follwersCount: Promise<void> = connectionCache.updateConnectionCountInCache(
			`${followerId}`,
			'followersCount',
			1
		);

		const follweeCount: Promise<void> = connectionCache.updateConnectionCountInCache(
			`${req.currentUser?.userId}`,
			'followingCount',
			1
		);

		await Promise.all([follwersCount, follweeCount]);

		const cachedFollower: Promise<IUserDocument> = userCache.getUserFromCache(
			`${followerId}`
		) as Promise<IUserDocument>;

		const cachedFollowee: Promise<IUserDocument> = userCache.getUserFromCache(
			`${req.currentUser?.userId}`
		) as Promise<IUserDocument>;

		const response: [IUserDocument, IUserDocument] = (await Promise.all([
			cachedFollower,
			cachedFollowee
		])) as [IUserDocument, IUserDocument];

		const followerObjectId: ObjectId = new ObjectId();
		const addFolloweeData: IFollowerData = Add.prototype.userData(response[0]);

		const addFollowerToCache: Promise<void> = connectionCache.saveFollowerToCache(
			`followers:${req.currentUser?.userId}`,
			`${followerId}`
		);

		const addFolloweeToCache: Promise<void> = connectionCache.saveFollowerToCache(
			`following:${followerId}`,
			`${req.currentUser?.userId}`
		);

		await Promise.all([addFollowerToCache, addFolloweeToCache]);

		// SEND DATA TO CLIENT VIA SOCKET
		socketIOConnectionObject.emit('add follower', addFolloweeData);

		// SEND DATA TO QUEUE
		connectionQueue.addConnectionJob('addConnectionToDB', {
			keyOne: `${req.currentUser?.userId}`,
			keyTwo: `${followerId}`,
			username: `${req.currentUser?.username}`,
			followerDocumentId: followerObjectId
		});

		res.status(HTTP_STATUS.OK).json({
			message: 'Followed user successfully.'
		});
	}

	private userData(user: IUserDocument): IFollowerData {
		return {
			_id: new mongoose.Types.ObjectId(user._id),
			username: user.username!,
			uId: user.uId!,
			avatarColor: user.avatarColor!,
			postCount: user.postsCount!,
			followersCount: user.followersCount,
			followingCount: user.followingCount,
			profilePicture: user.profilePicture!,
			userProfile: user
		};
	}
}
