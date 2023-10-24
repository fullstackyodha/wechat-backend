import { IPostJobData } from '@post/interfaces/post.interface';
import { BaseQueue } from './base.queue';
import { postWorker } from '@worker/post.worker';

class PostQueue extends BaseQueue {
	constructor() {
		super('posts');
		// Process the JOB with name of the Job, concurrency, and Job to be done
		this.processJob('addPostToDB', 5, postWorker.addPostToDB);
		this.processJob('deletePostFromDB', 5, postWorker.deletePostFromDB);
		this.processJob('updatePostInDB', 5, postWorker.updatePostInDB);
	}

	public addPostJob(name: string, data: IPostJobData): void {
		this.addJob(name, data);
	}
}

export const postQueue: PostQueue = new PostQueue();
