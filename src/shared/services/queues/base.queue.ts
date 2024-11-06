import Logger from 'bunyan';

import Queue, { Job } from 'bull';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';

import { config } from '@root/config';

import { IAuthJob } from '@auth/interfaces/auth.interface';
import { IEmailJob } from '@user/interfaces/user.interface';
import { IPostJobData } from '@post/interfaces/post.interface';
import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ICommentJob } from '@comments/interfaces/comment.interface';
import { IFollowerJobData } from '@connections/interfaces/connections.interface';

type IBaseJobData =
	| IAuthJob
	| IEmailJob
	| IPostJobData
	| IReactionJob
	| ICommentJob
	| IFollowerJobData;

// ARRAY TO STORE THE DISTINCT QUEUES
let bullAdapters: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
	queue: Queue.Queue;
	log: Logger;

	constructor(queueName: string) {
		// CREATING QUEUE. It creates a new Queue that is persisted in Redis.
		this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
		// Push Queue to the adapter
		bullAdapters.push(new BullAdapter(this.queue));
		// ONLY DISTINCT QUEUES
		bullAdapters = [...new Set(bullAdapters)];

		// SERVER ADAPTER
		serverAdapter = new ExpressAdapter();
		serverAdapter.setBasePath('/queues');

		// CREATING BULL BOARD
		createBullBoard({ queues: bullAdapters, serverAdapter });

		this.log = config.createLogger(`${queueName}Queue`);

		this.queue.on('completed', async (job: Job) => {
			// Removes a job from the queue when completed
			// and from any lists it may be included in
			await job.remove();
		});

		this.queue.on('global:completed', async (jobId: string) => {
			this.log.info(`Job ${jobId} completed`);
		});

		this.queue.on('global:stalled', async (jobId: string) => {
			this.log.info(`Job ${jobId} stalled`);
		});
	}

	protected addJob(name: string, data: IBaseJobData): void {
		// Creates a new job and adds it to the queue
		this.queue.add(name, data, {
			attempts: 3, // The total number of attempts to try the job until it completes
			backoff: { type: 'fixed', delay: 5000 } // Backoff setting for automatic retries if the job fails
		});
	}

	protected processJob(
		name: string,
		concurrency: number,
		callback: Queue.ProcessCallbackFunction<void>
	): void {
		// concurrency - process x number of job at a time from the queue
		this.queue.process(name, concurrency, callback);
	}
}
