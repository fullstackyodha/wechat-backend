import { IFollowerJobData } from '@connections/interfaces/connections.interface';
import { BaseQueue } from './base.queue';
import { connectionWorker } from '@worker/connection.worker';

class ConnectionQueue extends BaseQueue {
	constructor() {
		super('connection');

		// Process the JOB with name of the Job, concurrency, and Job to be done
		this.processJob('addConnectionToDB', 5, connectionWorker.addConnectionToDB);
		this.processJob(
			'removeConnectionFromDB',
			5,
			connectionWorker.removeConnectionFromDB
		);
	}

	public addConnectionJob(name: string, data: IFollowerJobData): void {
		this.addJob(name, data);
	}

	public removeConnectionJob(name: string, data: IFollowerJobData): void {
		this.addJob(name, data);
	}
}

export const connectionQueue: ConnectionQueue = new ConnectionQueue();
