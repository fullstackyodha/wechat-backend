import mongoose from 'mongoose';
import Logger from 'bunyan';

import { config } from '@root/config';
import { redisConnection } from '@service/redis/redis.connection';

// INDICATES THAT ERROR CAME FROM SERVER FILE
const log: Logger = config.createLogger('databaseSetup');

export default function () {
	const connect = () => {
		// Replacing password with our password variable from env
		const database_url = config.DATABASE_URL!.replace(
			'<password>',
			config.DATABASE_PASSWORD!
		)!;

		// Conenct to mongodb via mongoose
		mongoose
			.connect(database_url)
			.then(() => {
				log.info('DATABASE SUCCESSFULLY CONNECTED!!!');

				// CONNECTION TO REDIS CLIENT
				redisConnection.connect();
			})
			.catch(() => {
				log.error('ERROR CONNECTING DATABASE!!!');

				// Terminate the process synchronously
				return process.exit(1);
			});
	};

	connect();

	// if not connected then it tries to connect again
	mongoose.connection.on('disconnected', connect);
}
