import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';

import { commentService } from '@service/db/comment.service';
import { config } from '@root/config';

const log: Logger = config.createLogger('postWorker');

class CommentWorker {
	async addCommentToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting comment data from the job
			const { data } = job;

			// adding post to the database
			await commentService.addPostCommentToDB(data);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const commentWorker: CommentWorker = new CommentWorker();
