import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';
import mongoose from 'mongoose';

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
}

export const userService: UserService = new UserService();
