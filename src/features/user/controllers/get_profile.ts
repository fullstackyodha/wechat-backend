import { IFollowerData } from '@connections/interfaces/connections.interface';
import { userService } from '@service/db/user.service';
import { UserCache } from '@service/redis/user.cache';
import { ConnectionCache } from '@service/redis/connection.cache';
import { IAllUsers, IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { connectionService } from '@service/db/connection.service';
import mongoose from 'mongoose';
import { Helpers } from '@global/helpers/helpers';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostCache } from '@service/redis/post.cache';
import { postService } from '@service/db/post.service';

const userCache: UserCache = new UserCache();
const postCache: PostCache = new PostCache();
const connectionCache: ConnectionCache = new ConnectionCache();

const PAGE_SIZE = 12;

interface IUserAll {
	newSkip: number;
	limit: number;
	skip: number;
	userId: string;
}

export class Get {
	public async profile(req: Request, res: Response): Promise<void> {
		const cachedUser: IUserDocument = (await userCache.getUserFromCache(
			`${req.currentUser?.userId}`
		)) as IUserDocument;

		const exisitingUser: IUserDocument = cachedUser
			? cachedUser
			: ((await userService.getUserById(
					`${req.currentUser?.userId}`
				)) as IUserDocument);

		res.status(HTTP_STATUS.OK).json({
			message: 'User Profile',
			data: { user: exisitingUser }
		});
	}

	public async profileByUserId(req: Request, res: Response): Promise<void> {
		const { userId } = req.params;

		const cachedUser: IUserDocument = (await userCache.getUserFromCache(
			`${userId}`
		)) as IUserDocument;

		const exisitingUser: IUserDocument = cachedUser
			? cachedUser
			: ((await userService.getUserById(userId)) as IUserDocument);

		res.status(HTTP_STATUS.OK).json({
			message: 'User Profile by user id',
			data: { user: exisitingUser }
		});
	}

	public async profileAndPosts(req: Request, res: Response): Promise<void> {
		const { userId, username, uId } = req.params;

		const userName: string = Helpers.firstLetterUppercase(username);

		const cachedUser: IUserDocument = (await userCache.getUserFromCache(
			`${userId}`
		)) as IUserDocument;

		const cachedUserPost: IPostDocument[] = await postCache.getUserPostFromCache(
			'posts',
			+uId
		);

		const exisitingUser: IUserDocument = cachedUser
			? cachedUser
			: ((await userService.getUserById(userId)) as IUserDocument);

		const userPost: IPostDocument[] = cachedUserPost.length
			? cachedUserPost
			: await postService.getPostFromDB({ username: userName }, 0, 100, {
					createdAt: -1
				});

		res.status(HTTP_STATUS.OK).json({
			message: 'User Profile and Post',
			data: { user: exisitingUser, posts: userPost }
		});
	}

	public async all(req: Request, res: Response): Promise<void> {
		const { page } = req.params;
		const skip: number = (+page - 1) * PAGE_SIZE;
		const limit: number = PAGE_SIZE * +page;
		const newSkip: number = skip === 0 ? skip : skip + 1;

		const { users, totalUsers } = await Get.prototype.allUsers({
			newSkip,
			limit,
			skip,
			userId: `${req.currentUser?.userId}`
		});

		const followers: IFollowerData[] = await Get.prototype.followers(
			`${req.currentUser!.userId}`
		);

		res.status(HTTP_STATUS.OK).json({
			message: 'All Users',
			data: { users, totalUsers, followers }
		});
	}

	private async allUsers({
		newSkip,
		limit,
		skip,
		userId
	}: IUserAll): Promise<IAllUsers> {
		let users,
			type = '';

		const cachedUser: IUserDocument[] = (await userCache.getUsersFromCache(
			newSkip,
			limit,
			userId
		)) as IUserDocument[];

		if (cachedUser.length) {
			type = 'redis';
			users = cachedUser;
		} else {
			type = 'mongodb';
			users = await userService.getAllUsers(userId, skip, limit);
		}

		const totalUsers: number = await Get.prototype.usersCount(type);

		return { users, totalUsers: totalUsers };
	}

	public async randomUserSuggestions(req: Request, res: Response): Promise<void> {
		let randomUsers: IUserDocument[] = [];

		const cachedUsers: IUserDocument[] = await userCache.getRandomUserFromCache(
			`${req.currentUser!.userId}`,
			req.currentUser!.username
		);

		if (cachedUsers.length) {
			randomUsers = [...cachedUsers];
		} else {
			const users: IUserDocument[] = await userService.getRandomUsers(
				req.currentUser!.userId
			);

			randomUsers = [...users];
		}

		res.status(HTTP_STATUS.OK).json({
			message: 'User suggestions',
			data: { users: randomUsers }
		});
	}

	private async usersCount(type: string): Promise<number> {
		const totalUsers: number =
			type === 'redis'
				? await userCache.getTotalUsersInCache()
				: await userService.getTotalUsersInDB();
		return totalUsers;
	}

	private async followers(userId: string): Promise<IFollowerData[]> {
		const cachedFollower: IFollowerData[] =
			(await connectionCache.getFollowersFromCache(
				`followers:${userId}`
			)) as IFollowerData[];

		const result = cachedFollower.length
			? cachedFollower
			: await connectionService.getFollowerData(new mongoose.Types.ObjectId(userId));

		return result;
	}
}
