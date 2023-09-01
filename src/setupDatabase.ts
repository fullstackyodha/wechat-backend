import mongoose from 'mongoose';
import { config } from './config';
import Logger from 'bunyan';

// INDICATES THAT ERROR CAME FROM SERVER FILE
const log: Logger = config.createLogger('databaseSetup');

export default function () {
	const connect = () => {
		// Replacing password with our password variable from env
		const database_url = config.DATABASE_URL!.replace(
			'<password>',
			config.DATABASE_PASSWORD!
		)!;

		mongoose
			.connect(database_url)
			.then((conn) => log.info('DATABASE SUCCESSFULLY CONNECTED!!!'))
			.catch((err) => {
				log.error('ERROR CONNECTING DATABASE!!!');
				return process.exit(1);
			});
	};

	connect();

	// if not connected then it tries to connect again
	mongoose.connection.on('disconnection', connect);
}
