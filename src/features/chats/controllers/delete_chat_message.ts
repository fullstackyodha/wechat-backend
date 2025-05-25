import { IMessageData } from '@chats/interfaces/chat.interface';
import { chatQueue } from '@service/queues/chat.queue.';
import { MessageCache } from '@service/redis/message.cache';
import { socketIOChatObject } from '@socket/chat';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import HTTPS_STATUS from 'http-status-codes';

const messageCache: MessageCache = new MessageCache();

export class Delete {
	public async markMessageAsDelete(req: Request, res: Response): Promise<void> {
		const { senderId, receiverId, messageId, type } = req.params;

		const updatedMessage: IMessageData = await messageCache.markMessageAsDeleted(
			`${senderId}`,
			`${receiverId}`,
			`${messageId}`,
			`${type}`
		);

		socketIOChatObject.emit('message read', updatedMessage);
		socketIOChatObject.emit('chat list', updatedMessage);

		chatQueue.markMessageAsDeletedJob('markMessageAsDeletedInDB', {
			messageId: new mongoose.Types.ObjectId(messageId),
			type
		});

		res.status(HTTPS_STATUS.OK).json({ message: 'Message Deleted Successfully' });
	}
}
