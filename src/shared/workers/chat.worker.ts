import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';

import { config } from '@root/config';
import { chatService } from '@service/db/chat.service';

const log: Logger = config.createLogger('chatWorker');

class ChatWorker {
	async addChatMessageToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting chat data from the job
			const { data } = job;

			// adding chat to the database
			await chatService.addMessageToDB(data);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async markMessageAsDeleted(job: Job, done: DoneCallback): Promise<void> {
		try {
			const {
				data: { messageId, type }
			} = job;

			await chatService.markMessageAsDeleted(messageId, type);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async markMessagesAsReadInDB(jobQueue: Job, done: DoneCallback): Promise<void> {
		try {
			const { senderId, receiverId } = jobQueue.data;

			await chatService.markMessagesAsRead(senderId, receiverId);

			jobQueue.progress(100);

			done(null, jobQueue.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async updateMessageReaction(jobQueue: Job, done: DoneCallback): Promise<void> {
		try {
			const { messageId, senderName, reaction, type } = jobQueue.data;

			await chatService.updateMessageReaction(messageId, senderName, reaction, type);

			jobQueue.progress(100);

			done(null, jobQueue.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const chatWorker: ChatWorker = new ChatWorker();
