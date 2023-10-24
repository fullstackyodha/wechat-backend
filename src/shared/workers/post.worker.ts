import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { postService } from '@service/db/post.service';

const log: Logger = config.createLogger('postWorker');

class PostWorker {
	// ADD POST DATA FROM THE QUEUE TO DATABASE
	async addPostToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { key: userId, value: createdPost } = job.data;

			// adding post to the database
			await postService.addPostToDB(userId, createdPost);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	// UPDATE POST DATA FROM THE QUEUE TO DATABASE
	async updatePostInDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { key: postId, value: updatedPost } = job.data;

			// adding post to the database
			await postService.updatePostInDB(postId, updatedPost);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	// Delete POST DATA FROM THE QUEUE TO DATABASE
	async deletePostFromDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { keyOne: postId, keyTwo: userId } = job.data;

			// adding post to the database
			await postService.deletePostFromDB(postId, userId);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const postWorker: PostWorker = new PostWorker();
