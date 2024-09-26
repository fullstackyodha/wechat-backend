import { ServerError } from '@global/helpers/error_handler';
import { BaseCache } from './base.cache';
import { config } from '@root/config';

import Logger from 'bunyan';

const log: Logger = config.createLogger('connectionsCache');

export class ConnectionCache extends BaseCache {
	constructor() {
		super('connectionsCache');
	}

	public async saveFollowerToCache(key: string, value: string): Promise<void> {
		try {
			if (!this.client.connect()) {
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
			if (!this.client.connect()) {
				this.client.connect();
			}

			// KEY WILL THE STRUCTURE OF Follower: ID OR Following:ID
			await this.client.LREM(key, 1, value);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async updateFollowersCountInCache(
		key: string, // ID OF USER
		prop: string, // followerCount / followingCount
		value: number // 1 / -1
	): Promise<void> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}

			await this.client.HINCRBY(`users:${key}`, prop, value);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}
}
