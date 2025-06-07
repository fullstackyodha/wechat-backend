import Logger from 'bunyan';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';

const log: Logger = config.createLogger('redisConnection');

class RedisConnection extends BaseCache {
	constructor() {
		super('redisConnection'); // cacheName
	}

	async connect(): Promise<void> {
		try {
			// ACCESS THE CLIENT FROM THE BASE CLASS
			await this.client.connect(); // returns promise
			const res = await this.client.ping(); // returns promise
			console.log('REDIS SERVER RESPONSE:', res); // PONG
		} catch (err) {
			log.error(err);
		}
	}
}

export const redisConnection: RedisConnection = new RedisConnection();
