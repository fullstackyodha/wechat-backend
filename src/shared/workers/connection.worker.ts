import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';

import { config } from '@root/config';
import { connectionService } from '@service/db/connection.service';

const log: Logger = config.createLogger('postWorker');

class ConnectionWorker {
	async addConnectionToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const {
				keyOne: userId,
				keyTwo: followeeId,
				username,
				followerDocumentId
			} = job.data;

			await connectionService.addFollowerToDB(
				userId,
				followeeId,
				username,
				followerDocumentId
			);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async removeConnectionFromDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { keyOne: userId, keyTwo: followeeId } = job.data;

			await connectionService.removeFollowerFromDB(userId, followeeId);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const connectionWorker: ConnectionWorker = new ConnectionWorker();
