import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { userService } from '@service/db/user.service';

const log: Logger = config.createLogger('userWorker');

class UserWorker {
	async addUserToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { value } = job.data;

			// adding data to the database
			await userService.addUserDataToDB(value);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const userWorker: UserWorker = new UserWorker();
