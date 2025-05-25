import { chatWorker } from '@worker/chat.worker';
import { BaseQueue } from './base.queue';
import {
	IChatJobData,
	IMarkAsDelete,
	IMessageData
} from '@chats/interfaces/chat.interface';

class ChatQueue extends BaseQueue {
	constructor() {
		super('chats');
		// Process the JOB with name of the Job, concurrency, and Job to be done
		this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB);
		this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeleted);
	}

	public addChatMessageJob(name: string, data: IChatJobData | IMessageData): void {
		this.addJob(name, data);
	}

	public markMessageAsDeletedJob(name: string, data: IMarkAsDelete): void {
		this.addJob(name, data);
	}
}

export const chatQueue: ChatQueue = new ChatQueue();
