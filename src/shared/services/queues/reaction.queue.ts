import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { BaseQueue } from './base.queue';
import { reactionWorker } from '@worker/reaction.worker';

class ReactionQueue extends BaseQueue {
	constructor() {
		super('reactions');
		// Process the JOB with name of the Job, concurrency, and Job to be done
		this.processJob('addReactionToDB', 5, reactionWorker.addReactionToDB);
		this.processJob('removeReactionFromDB', 5, reactionWorker.removeReactionToDB);
	}

	public addReactionJob(name: string, data: IReactionJob): void {
		this.addJob(name, data);
	}
}

export const reactionQueue: ReactionQueue = new ReactionQueue();
