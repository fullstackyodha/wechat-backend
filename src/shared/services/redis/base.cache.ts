import Logger from 'bunyan';
import { createClient } from 'redis';

import { config } from '@root/config';

// sudo service redis-server start

// Creating a return type for our client as createClient
export type RedisClient = ReturnType<typeof createClient>;

export abstract class BaseCache {
	client: RedisClient;
	log: Logger;

	constructor(cacheName: string) {
		// Connecting client to the REDIS HOST URL
		this.client = createClient({ url: config.REDIS_HOST });
		this.log = config.createLogger(cacheName);
		this.catchError();
	}

	private catchError(): void {
		// Listen for error event
		this.client.on('error', (error: unknown) => {
			this.log.error(error);
		});
	}
}
