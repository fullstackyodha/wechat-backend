import { ServerError } from '@global/helpers/error_handler';
import { BaseCache } from './base.cache';
import { config } from '@root/config';

import Logger from 'bunyan';
import { IFollowerData } from '@connections/interfaces/connections.interface';
import { UserCache } from './user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose from 'mongoose';
import { Helpers } from '@global/helpers/helpers';
import { remove } from 'lodash';

const log: Logger = config.createLogger('connectionsCache');
const userCache: UserCache = new UserCache();

export class ConnectionCache extends BaseCache {
	constructor() {
		super('connectionsCache');
	}

	public async saveFollowerToCache(key: string, value: string): Promise<void> {
		try {
			if (!this.client.isOpen) {
				this.client.connect();
			}

			// KEY WILL THE STRUCTURE OF Follower: ID OR Following:ID
			await this.client.LPUSH(key, value);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async removeFollowerFromCache(key: string, value: string): Promise<void> {
		try {
			if (!this.client.isOpen) {
				this.client.connect();
			}

			// KEY WILL THE STRUCTURE OF Follower: ID OR Following:ID
			await this.client.LREM(key, 1, value);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async updateConnectionCountInCache(
		key: string, // ID OF USER
		prop: string, // followerCount / followingCount
		value: number // 1 / -1
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				this.client.connect();
			}

			await this.client.HINCRBY(`users:${key}`, prop, value);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getFollowersFromCache(
		key: string // ID OF USER
	): Promise<IFollowerData[]> {
		try {
			if (!this.client.isOpen) {
				this.client.connect();
			}

			const response: string[] = await this.client.LRANGE(`${key}`, 0, -1);

			const list: IFollowerData[] = [];

			for (const item of response) {
				const user: IUserDocument = (await userCache.getUserFromCache(
					item
				)) as IUserDocument;

				const data: IFollowerData = {
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

				list.push(data);
			}

			return list;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async updateBlockedUserPropInCache(
		key: string,
		value: string,
		prop: string,
		type: 'block' | 'unblock'
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				this.client.connect();
			}

			const response: string = (await this.client.HGET(`users${key}`, prop)) as string;

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();
			let blocked: string[] = Helpers.parseJson(response) as string[];

			if (type === 'block') {
				blocked = [...blocked, value];
			} else {
				remove(blocked, (id: string) => id === value);
				blocked = [...blocked];
			}

			multi.HSET(`users${key}`, `${prop}`, JSON.stringify(blocked));

			await multi.exec();
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}
}
