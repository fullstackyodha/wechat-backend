import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { MessageCache } from '@service/redis/message.cache';
import { socketIOChatObject } from '@socket/chat';
import { IMessageData } from '@chats/interfaces/chat.interface';
import { chatQueue } from '@service/queues/chat.queue.';

const messageCache: MessageCache = new MessageCache();

export class Message {
	public async reaction(req: Request, res: Response): Promise<void> {
		const { conversationId, messageId, reaction, type } = req.body;

		const updatedMessage: IMessageData = await messageCache.updateMessageReaction(
			`${conversationId}`,
			`${messageId}`,
			`${reaction}`,
			`${req.currentUser!.username}`,
			type
		);

		socketIOChatObject.emit('message reaction', updatedMessage);

		chatQueue.addChatJob('updateMessageReaction', {
			messageId: new mongoose.Types.ObjectId(messageId),
			senderName: req.currentUser!.username,
			reaction,
			type
		});

		res.status(HTTP_STATUS.OK).json({ message: 'Message reaction added' });
	}
}
