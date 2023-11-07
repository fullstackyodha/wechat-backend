import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { reactionService } from '@service/db/reaction.service';

const log: Logger = config.createLogger('reactionWorker');

class ReactionWorker {
	// ADD REACTION DATA FROM THE QUEUE TO DATABASE
	async addReactionToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting reaction data from the job
			const { data: reactionData } = job;

			// adding reaction to the database
			await reactionService.addReactionDataToDB(reactionData);

			// Report progress on a job
			job.progress(100);

			done(null, reactionData);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async removeReactionToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting reaction data from the job
			const { data: reactionData } = job;

			// adding reaction to the database
			await reactionService.removeReactionDataFromDB(reactionData);

			// Report progress on a job
			job.progress(100);

			done(null, reactionData);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const reactionWorker: ReactionWorker = new ReactionWorker();
