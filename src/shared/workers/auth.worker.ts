import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { authService } from '@service/db/auth.service';

const log: Logger = config.createLogger('authWorker');

class AuthWorker {
	// ADD USER AUTH USER DATA FROM THE QUEUE TO DATABASE
	async addAuthUserToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { value } = job.data;

			// adding data to the database
			await authService.createAuthUser(value);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const authWorker: AuthWorker = new AuthWorker();
