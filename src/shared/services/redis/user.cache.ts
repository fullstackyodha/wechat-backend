import { ServerError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import {
	INotificationSettings,
	ISocialLinks,
	IUserDocument
} from '@user/interfaces/user.interface';
import Logger from 'bunyan';
import { findIndex, indexOf } from 'lodash';

const log: Logger = config.createLogger('userCache');

type UserItem = string | ISocialLinks | INotificationSettings;

// CREATING A MULTI TYPE
export type UserCacheMultiType =
	| string
	| number
	| Buffer
	| IUserDocument
	| IUserDocument[];

export class UserCache extends BaseCache {
	constructor() {
		super('userCache');
	}

	public async saveUserToCache(
		key: string,
		userUId: string,
		createdUser: IUserDocument
	): Promise<void> {
		const createdAt = new Date();

		const {
			_id,
			uId,
			username,
			email,
			avatarColor,
			postsCount,
			blocked,
			blockedBy,
			profilePicture,
			followersCount,
			notifications,
			followingCount,
			social,
			quote,
			work,
			school,
			location,
			bgImageVersion,
			bgImageId
		} = createdUser;

		const firstList: string[] = [
			'_id',
			`${_id}`,
			'uId',
			`${uId}`,
			'username',
			`${username}`,
			'email',
			`${email}`,
			'avatarColor',
			`${avatarColor}`,
			'postsCount',
			`${postsCount}`,
			'createdAt',
			`${createdAt}`
		];

		const secondList: string[] = [
			'blocked',
			`${JSON.stringify(blocked)}`,
			'blockedBy',
			`${JSON.stringify(blockedBy)}`,
			'profilePicture',
			`${profilePicture}`,
			'followersCount',
			`${followersCount}`,
			'followingCount',
			`${followingCount}`,
			'notifications',
			`${JSON.stringify(notifications)}`,
			'social',
			`${JSON.stringify(social)}`
		];

		const thirdList: string[] = [
			'work',
			`${work}`,
			'location',
			`${location}`,
			'school',
			`${school}`,
			'quote',
			`${quote}`,
			'bgImageVersion',
			`${bgImageVersion}`,
			'bgImageId',
			`${bgImageId}`
		];

		const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// Create a user set and add a member with score = uid and value = key(userObjectId)
			await this.client.ZADD('users', {
				score: parseInt(userUId, 10),
				value: `${key}`
			});

			// Add member to HASH with key = users:userObejctId & value as created userData
			await this.client.HSET(`users:${key}`, dataToSave);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const response: IUserDocument = (await this.client.HGETALL(
				`users:${userId}`
			)) as unknown as IUserDocument;

			response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
			response.postsCount = Helpers.parseJson(`${response.postsCount}`);
			response.blocked = Helpers.parseJson(`${response.blocked}`);
			response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
			// response.work = Helpers.parseJson(`${response.work}`);
			// response.school = Helpers.parseJson(`${response.school}`);
			// response.location = Helpers.parseJson(`${response.location}`);
			// response.quote = Helpers.parseJson(`${response.quote}`);
			response.notifications = Helpers.parseJson(`${response.notifications}`);
			response.social = Helpers.parseJson(`${response.social}`);
			response.followersCount = Helpers.parseJson(`${response.followersCount}`);
			response.followingCount = Helpers.parseJson(`${response.followingCount}`);
			response.bgImageVersion = Helpers.parseJson(`${response.bgImageVersion}`);
			response.bgImageId = Helpers.parseJson(`${response.bgImageId}`);
			response.profilePicture = Helpers.parseJson(`${response.profilePicture}`);

			return response;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getUsersFromCache(
		start: number,
		end: number,
		excludedUserKey: string
	): Promise<IUserDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// GET USERS FROM SORTED SETS
			const response: string[] = await this.client.ZRANGE('users', start, end, {
				REV: true
			});

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			for (const key of response) {
				if (key !== excludedUserKey) {
					multi.HGETALL(`users:${key}`);
				}
			}

			const replies: UserCacheMultiType =
				(await multi.exec()) as unknown as UserCacheMultiType;

			const users: IUserDocument[] = [];

			for (const user of replies as IUserDocument[]) {
				user.createdAt = new Date(Helpers.parseJson(`${user.createdAt}`));
				user.postsCount = Helpers.parseJson(`${user.postsCount}`);
				user.blocked = Helpers.parseJson(`${user.blocked}`);
				user.blockedBy = Helpers.parseJson(`${user.blockedBy}`);
				user.notifications = Helpers.parseJson(`${user.notifications}`);
				user.social = Helpers.parseJson(`${user.social}`);
				user.followersCount = Helpers.parseJson(`${user.followersCount}`);
				user.followingCount = Helpers.parseJson(`${user.followingCount}`);
				user.bgImageVersion = Helpers.parseJson(`${user.bgImageVersion}`);
				user.bgImageId = Helpers.parseJson(`${user.bgImageId}`);
				user.profilePicture = Helpers.parseJson(`${user.profilePicture}`);

				users.push(user);
			}

			return users;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getTotalUsersInCache(): Promise<number> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const count: number = await this.client.ZCARD('users');
			return count as number;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async updateSingleUserItemInCache(
		userId: string,
		prop: string,
		value: UserItem
	): Promise<IUserDocument | null> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const dataToSave: string[] = [`${prop}`, JSON.stringify(value)];

			await this.client.HSET(`users:${userId}`, dataToSave);

			const response: IUserDocument = (await this.getUserFromCache(
				userId
			)) as IUserDocument;

			return response;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getRandomUserFromCache(
		userId: string,
		excludedUsername: string
	): Promise<IUserDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const replies: IUserDocument[] = [];

			const followers: string[] = await this.client.LRANGE(
				`followers:${userId}`,
				0,
				-1
			);

			const users: string[] = await this.client.ZRANGE('users', 0, -1);

			const randomUsers: string[] = Helpers.shuffle(users).slice(0, 10);

			for (const key of randomUsers) {
				const followerIndex = indexOf(followers, key);

				if (followerIndex < 0) {
					const userHash: IUserDocument = (await this.client.HGETALL(
						`users:${key}`
					)) as unknown as IUserDocument;

					replies.push(userHash);
				}
			}

			const excludedUsernameIndex: number = findIndex(replies, [
				'username',
				excludedUsername
			]);

			replies.splice(excludedUsernameIndex, 1);

			for (const reply of replies) {
				reply.createdAt = new Date(Helpers.parseJson(`${reply.createdAt}`));
				reply.postsCount = Helpers.parseJson(`${reply.postsCount}`);
				reply.blocked = Helpers.parseJson(`${reply.blocked}`);
				reply.blockedBy = Helpers.parseJson(`${reply.blockedBy}`);
				reply.notifications = Helpers.parseJson(`${reply.notifications}`);
				reply.social = Helpers.parseJson(`${reply.social}`);
				reply.followersCount = Helpers.parseJson(`${reply.followersCount}`);
				reply.followingCount = Helpers.parseJson(`${reply.followingCount}`);
				reply.bgImageId = Helpers.parseJson(`${reply.bgImageId}`);
				reply.bgImageVersion = Helpers.parseJson(`${reply.bgImageVersion}`);
				reply.profilePicture = Helpers.parseJson(`${reply.profilePicture}`);
			}

			return replies;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}
}
