import {
	IFollowerData,
	IFollowerDocument
} from '@connections/interfaces/connections.interface';
import { FollowerModel } from '@connections/models/connections.schema';
import {
	INotificationDocument,
	INotificationTemplate
} from '@notifications/interfaces/notification.interface';
import { NotificationModel } from '@notifications/models/notification.scehma';
import { IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { notificationTemplate } from '@service/email/templates/notifications/notification.template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { socketIONotificationObject } from '@socket/notifications';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import { map } from 'lodash';
import { ObjectId, PushOperator } from 'mongodb';
import mongoose, { mongo, Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class ConnectionService {
	public async addFollowerToDB(
		userId: string,
		followeeId: string,
		username: string,
		followerDocumentId: ObjectId
	) {
		// Casting String to ObjectId
		const followeeObjectId = new mongoose.Types.ObjectId(followeeId);
		const followerObjectId = new mongoose.Types.ObjectId(userId);

		const following = await FollowerModel.create({
			_id: followerDocumentId,
			followeeId: followeeObjectId,
			followerId: followerObjectId
		});

		// Incrementing follower and following count
		const users: Promise<mongo.BulkWriteResult> = UserModel.bulkWrite([
			{
				updateOne: {
					filter: { _id: userId },
					update: { $inc: { followingCount: 1 } }
				}
			},
			{
				updateOne: {
					filter: { _id: followeeId },
					update: { $inc: { followersCount: 1 } }
				}
			}
		]);

		const response: [mongo.BulkWriteResult, IUserDocument | null] = await Promise.all([
			users,
			userCache.getUserFromCache(followeeId)
		]);

		if (response[1]?.notifications.follows && userId !== followeeId) {
			const notificationModel: INotificationDocument = new NotificationModel();

			const notifications = await notificationModel.insertNotification({
				userTo: followeeId,
				userFrom: userId,
				message: `${username} folowed you`,
				notificationType: 'follows',
				entityId: new mongoose.Types.ObjectId(userId),
				createdItemId: new mongoose.Types.ObjectId(following._id),
				createdAt: new Date(),
				comment: '',
				post: '',
				reaction: '',
				imgId: '',
				imgVersion: '',
				gifUrl: '',
				read: false
			});

			// SEND TO CLIENT USING SOCKET IO
			socketIONotificationObject.emit('insert notification', notifications, {
				userTo: followeeId
			});

			// SEND TO EMAIL QUEUE
			const templateParams: INotificationTemplate = {
				username: response[1]?.username ?? '',
				message: `${username} folowed you`,
				header: 'New Connection Notification'
			};

			const template: string =
				notificationTemplate.notificationMessageTemplate(templateParams);

			emailQueue.addEmailJob('connectionEmail', {
				receiverEmail: response[1]?.email ?? '',
				template,
				subject: `${username} folowed you`
			});
		}
	}

	public async removeFollowerFromDB(followeeId: string, followerId: string) {
		// Casting String to ObjectId
		const followeeObjectId = new mongoose.Types.ObjectId(followeeId);
		const followerObjectId = new mongoose.Types.ObjectId(followerId);

		const unfollow: Query<IQueryComplete & IQueryDeleted, IFollowerDocument> =
			FollowerModel.deleteOne({
				followeeId: followeeObjectId,
				followerId: followerObjectId
			});

		// Incrementing follower and following count
		const users: Promise<mongo.BulkWriteResult> = UserModel.bulkWrite([
			{
				updateOne: {
					filter: { _id: followerId },
					update: { $inc: { followingCount: -1 } }
				}
			},
			{
				updateOne: {
					filter: { _id: followeeId },
					update: { $inc: { followersCount: -1 } }
				}
			}
		]);

		await Promise.all([unfollow, users]);
	}

	public async getFolloweeData(userObjectId: ObjectId): Promise<IFollowerData[]> {
		const followee = await FollowerModel.aggregate([
			{
				$match: { followerId: userObjectId }
			},
			{
				$lookup: {
					from: 'User',
					localField: 'followeeId',
					foreignField: '_id',
					as: 'followeeId'
				}
			},
			{ $unwind: '$followeeId' },
			{
				$lookup: {
					from: 'Auth',
					localField: 'followeeId.authId',
					foreignField: '_id',
					as: 'authId'
				}
			},
			{ $unwind: '$authId' },
			{
				$addFields: {
					_id: '$followeeId._id',
					username: '$authId.username',
					profilePicture: '$authId.profilePicture',
					uId: '$authId.uId',
					avatarColor: '$authId.avatarColor',
					followeeProfilePicture: '$followeeId.profilePicture',
					postCount: '$followeeId.postsCount',
					followingCount: '$followeeId.followingCount',
					followerCount: '$followeeId.followerCount',
					userProfile: '$followeeId'
				}
			},
			{ $project: { __v: 0, authId: 0, followeeId: 0, createdAt: 0 } }
		]);

		return followee;
	}

	public async getFollowerData(userObjectId: ObjectId): Promise<IFollowerData[]> {
		const follower = await FollowerModel.aggregate([
			{
				$match: { followeeId: userObjectId }
			},
			{
				$lookup: {
					from: 'User',
					localField: 'followerId',
					foreignField: '_id',
					as: 'followerId'
				}
			},
			{ $unwind: '$followeeId' },
			{
				$lookup: {
					from: 'Auth',
					localField: 'followerId.authId',
					foreignField: '_id',
					as: 'authId'
				}
			},
			{ $unwind: '$authId' },
			{
				$addFields: {
					_id: '$followerId._id',
					username: '$authId.username',
					profilePicture: '$authId.profilePicture',
					uId: '$authId.uId',
					avatarColor: '$authId.avatarColor',
					followerProfilePicture: '$followerId.profilePicture',
					postCount: '$followerId.postsCount',
					followingCount: '$followerId.followingCount',
					followerCount: '$followerId.followerCount',
					userProfile: '$followerId'
				}
			},
			{ $project: { __v: 0, authId: 0, followerId: 0, createdAt: 0 } }
		]);

		return follower;
	}

	public async blockUser(userId: string, followerId: string): Promise<void> {
		await UserModel.bulkWrite([
			{
				updateOne: {
					filter: {
						_id: userId,
						blocked: { $ne: new mongoose.Types.ObjectId(followerId) }
					},
					update: { $push: { blocked: followerId } as PushOperator<Document> }
				}
			},
			{
				updateOne: {
					filter: {
						_id: followerId,
						blockedBy: { $ne: new mongoose.Types.ObjectId(userId) }
					},
					update: { $push: { blockedBy: userId } as PushOperator<Document> }
				}
			}
		]);
	}

	public async unBlockUser(userId: string, followerId: string): Promise<void> {
		await UserModel.bulkWrite([
			{
				updateOne: {
					filter: {
						_id: userId
					},
					update: { $pull: { blocked: followerId } as PushOperator<Document> }
				}
			},
			{
				updateOne: {
					filter: {
						_id: followerId
					},
					update: { $pull: { blockedBy: userId } as PushOperator<Document> }
				}
			}
		]);
	}

	public async getFolloweesIds(userId: string): Promise<string[]> {
		const followee = await FollowerModel.aggregate([
			{ $match: { followerId: new mongoose.Types.ObjectId(userId) } },
			{
				$project: {
					followeeId: 1,
					_id: 0
				}
			}
		]);

		return map(followee, (result) => result.followeeId.toString());
	}
}

export const connectionService: ConnectionService = new ConnectionService();
