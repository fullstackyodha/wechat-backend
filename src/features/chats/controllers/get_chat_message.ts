import { IMessageData } from '@chats/interfaces/chat.interface';
import { chatService } from '@service/db/chat.service';
import { MessageCache } from '@service/redis/message.cache';
// import { UserCache } from '@service/redis/user.cache';
import { Request, Response } from 'express';
import HTTPS_STATUS from 'http-status-codes';
import mongoose from 'mongoose';

// const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class Get {
	public async conversationList(req: Request, res: Response): Promise<void> {
		let list: IMessageData[] = [];
		const cachedList: IMessageData[] = await messageCache.getUserConversationList(
			`${req.currentUser!.userId}`
		);

		if (cachedList.length) {
			list = cachedList;
		} else {
			list = await chatService.getUserConversationList(
				new mongoose.Types.ObjectId(`${req.currentUser!.userId}`)
			);
		}

		res.status(HTTPS_STATUS.OK).json({ message: 'User Conversation List', list });
	}

	public async chatMessages(req: Request, res: Response): Promise<void> {
		const { receiverId } = req.params;

		let messages: IMessageData[] = [];
		const cachedMessages: IMessageData[] = await messageCache.getChatMessagesFromCache(
			`${req.currentUser!.userId}`,
			receiverId
		);

		if (cachedMessages.length) {
			messages = cachedMessages;
		} else {
			messages = await chatService.getMessages(
				new mongoose.Types.ObjectId(`${req.currentUser!.userId}`),
				new mongoose.Types.ObjectId(receiverId),
				{ createdAt: 1 }
			);
		}

		res.status(HTTPS_STATUS.OK).json({ message: 'User Chat Messages.', messages });
	}
}
