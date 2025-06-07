import { chatWorker } from '@worker/chat.worker';
import { BaseQueue } from './base.queue';
import { IChatJobData, IMessageData } from '@chats/interfaces/chat.interface';

class ChatQueue extends BaseQueue {
	constructor() {
		super('chats');
		// Process the JOB with name of the Job, concurrency, and Job to be done
		this.processJob('addChatMessageToDB', 5, chatWorker.addChatMessageToDB);
		this.processJob('markMessageAsDeletedInDB', 5, chatWorker.markMessageAsDeleted);
		this.processJob('markMessagesAsReadInDB', 5, chatWorker.markMessagesAsReadInDB);
		this.processJob('updateMessageReaction', 5, chatWorker.updateMessageReaction);
	}

	public addChatJob(name: string, data: IChatJobData | IMessageData): void {
		this.addJob(name, data);
	}
}

export const chatQueue: ChatQueue = new ChatQueue();
