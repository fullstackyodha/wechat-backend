import Queue, { Job } from 'bull';
import Logger from 'bunyan';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { config } from '@root/config';
import { IAuthJob } from '@auth/interfaces/auth.interface';

type IBaseJobData = IAuthJob;

// ARRAY TO STORE THE DISTINCT QUEUES
let bullAdapters: BullAdapter[] = [];

export let serverAdapter: ExpressAdapter;

export abstract class BaseQueue {
	queue: Queue.Queue;
	log: Logger;

	constructor(queueName: string) {
		// Queue constructor. It creates a new Queue that is persisted in Redis.
		this.queue = new Queue(queueName, `${config.REDIS_HOST}`);
		bullAdapters.push(new BullAdapter(this.queue));
		bullAdapters = [...new Set(bullAdapters)];
		serverAdapter = new ExpressAdapter();
		serverAdapter.setBasePath('/queues');

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
