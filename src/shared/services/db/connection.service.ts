import {
	IFollowerData,
	IFollowerDocument
} from '@connections/interfaces/connections.interface';
import { FollowerModel } from '@connections/models/connections.schema';
import { IQueryComplete, IQueryDeleted } from '@post/interfaces/post.interface';
import { UserModel } from '@user/models/user.schema';
import { ObjectId, PushOperator } from 'mongodb';
import mongoose, { mongo, Query } from 'mongoose';

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

		await FollowerModel.create({
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

		await Promise.all([users, UserModel.findOne({ _id: followeeId })]);
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
					profilePitcure: '$followeeId.profilePicture',
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
					profilePitcure: '$followerId.profilePicture',
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
}

export const connectionService: ConnectionService = new ConnectionService();
