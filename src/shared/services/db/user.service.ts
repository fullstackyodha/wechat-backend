import {
	IBasicInfo,
	INotificationSettings,
	ISearchUser,
	ISocialLinks,
	IUserDocument
} from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';
import { connectionService } from './connection.service';
import { indexOf } from 'lodash';
import { AuthModel } from '@auth/models/auth.schema';

class UserService {
	public async addUserDataToDB(data: IUserDocument): Promise<void> {
		await UserModel.create(data);
	}

	// GET USER BY ID
	public async getUserById(userId: string): Promise<IUserDocument> {
		const user: IUserDocument[] = await UserModel.aggregate([
			{
				$match: {
					// Converting string userId into Mongoose ObjectId
					_id: new mongoose.Types.ObjectId(userId)
				}
			},
			{
				// Look up into User collections with authId as foreign field
				// REFERENCING _id as Local field in Auth Collection
				$lookup: {
					from: 'Auth',
					foreignField: '_id', // in Auth
					localField: 'authId', // in User
					as: 'authId' // in User
				}
			},
			{
				// Unwinds all the properties & returns data as an object
				$unwind: '$authId'
			},
			{ $project: this.aggregateProject() }
		]);

		return user[0];
	}

	// GET USER BY AUTH ID
	public async getUserByAuthId(authId: string): Promise<IUserDocument> {
		const user: IUserDocument[] = await UserModel.aggregate([
			{
				$match: {
					// Converting string authId into Mongoose ObjectId
					authId: new mongoose.Types.ObjectId(authId)
				}
			},
			{
				// Look up into Auth collections with authId as local field
				// in User collection and _id as foreign field in Auth Collection
				$lookup: {
					from: 'Auth',
					localField: 'authId',
					foreignField: '_id',
					as: 'authId'
				}
			},
			{ $unwind: '$authId' },
			{ $project: this.aggregateProject() }
		]);

		return user[0];
	}

	public async getAllUsers(
		userId: string,
		skip: number,
		limit: number
	): Promise<IUserDocument[]> {
		const user: IUserDocument[] = await UserModel.aggregate([
			{
				$match: {
					// Converting string authId into Mongoose ObjectId
					_id: { $ne: new mongoose.Types.ObjectId(userId) }
				}
			},
			{
				$skip: skip
			},
			{
				$limit: limit
			},
			{
				$sort: {
					createdAt: -1
				}
			},
			{
				// Look up into Auth collections with authId as local field
				// in User collection and _id as foreign field in Auth Collection
				$lookup: {
					from: 'Auth',
					localField: 'authId',
					foreignField: '_id',
					as: 'authId'
				}
			},
			{ $unwind: '$authId' },
			{ $project: this.aggregateProject() }
		]);

		return user;
	}

	public async getRandomUsers(userId: string): Promise<IUserDocument[]> {
		const randomUsers: IUserDocument[] = [];

		const users: IUserDocument[] = await UserModel.aggregate([
			{ $match: { _id: { $ne: new mongoose.Types.ObjectId(userId) } } },
			{
				$lookup: {
					from: 'Auth',
					localField: 'authId',
					foreignField: '_id',
					as: 'authId'
				}
			},
			{ $unwind: '$authId' },
			{ $sample: { size: 10 } },
			{
				$addFields: {
					username: '$authId.username',
					email: '$authId.email',
					avatarColor: '$authId.avatarColor',
					uId: '$authId.uId',
					createdAt: '$authId.createdAt'
				}
			},
			{
				$project: {
					authId: 0,
					__v: 0
				}
			}
		]);

		const followers: string[] = await connectionService.getFolloweesIds(`${userId}`);

		for (const user of users) {
			const followerIndex = indexOf(followers, user._id.toString());

			if (followerIndex < 0) {
				randomUsers.push(user);
			}
		}
		return randomUsers;
	}

	public async getTotalUsersInDB(): Promise<number> {
		const total: number = await UserModel.find({}).countDocuments();
		return total;
	}

	private aggregateProject() {
		return {
			_id: 1,
			username: '$authId.username',
			uId: '$authId.uId',
			email: '$authId.email',
			avatarColor: '$authId.avatarColor',
			createdAt: '$authId.createdAt',
			postsCount: 1,
			work: 1,
			school: 1,
			quote: 1,
			location: 1,
			blocked: 1,
			blockedBy: 1,
			followersCount: 1,
			followingCount: 1,
			notifications: 1,
			social: 1,
			bgImageVersion: 1,
			bgImageId: 1,
			profilePicture: 1
		};
	}

	public async searchUsers(regex: RegExp): Promise<ISearchUser[]> {
		const users = await AuthModel.aggregate([
			{ $match: { username: regex } },
			{
				$lookup: {
					from: 'User',
					localField: '_id',
					foreignField: 'authId',
					as: 'user'
				}
			},
			{ $unwind: '$user' },
			{
				$project: {
					_id: '$user._id',
					username: 1,
					email: 1,
					avatarColor: 1,
					profilePicture: 1
				}
			}
		]);
		return users;
	}

	public async updatePassword(username: string, hashedPassword: string): Promise<void> {
		await AuthModel.updateOne(
			{ username },
			{ $set: { password: hashedPassword } }
		).exec();
	}

	public async updateUserInfo(userId: string, info: IBasicInfo): Promise<void> {
		await UserModel.updateOne(
			{ _id: userId },
			{
				$set: {
					work: info['work'],
					school: info['school'],
					quote: info['quote'],
					location: info['location']
				}
			}
		).exec();
	}

	public async updateSocialLinks(userId: string, links: ISocialLinks): Promise<void> {
		await UserModel.updateOne(
			{ _id: userId },
			{
				$set: { social: links }
			}
		).exec();
	}

	public async updateNotificationSettings(
		userId: string,
		settings: INotificationSettings
	): Promise<void> {
		await UserModel.updateOne(
			{ _id: userId },
			{ $set: { notifications: settings } }
		).exec();
	}
}

export const userService: UserService = new UserService();
