import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error_handler';
import { filter, find, findIndex, remove } from 'lodash';
import {
	IChatList,
	IChatUsers,
	IGetMessageFromCache,
	IMessageData
} from '@chats/interfaces/chat.interface';
import { Helpers } from '@global/helpers/helpers';
import { IReaction } from '@reaction/interfaces/reaction.interface';

const log: Logger = config.createLogger('messageCache');

export class MessageCache extends BaseCache {
	constructor() {
		super('messageCache');
	}

	public async addChatlistToCache(
		senderId: string,
		receiverId: string,
		conversationId: string
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const userChatList = await this.client.LRANGE(`chatList:${senderId}`, 0, -1);

			if (userChatList.length == 0) {
				await this.client.RPUSH(
					`chatList:${senderId}`,
					JSON.stringify({ receiverId, conversationId })
				);
			} else {
				const receiverIndex: number = findIndex(userChatList, (listItem: string) =>
					listItem.includes(receiverId)
				);

				// If receiver is not in the list add to the list
				if (receiverIndex < 0) {
					await this.client.RPUSH(
						`chatList:${senderId}`,
						JSON.stringify({ receiverId, conversationId })
					);
				}
			}
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async addChatMessageToCache(
		conversationId: string,
		message: IMessageData
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			await this.client.RPUSH(`messages:${conversationId}`, JSON.stringify(message));
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async markMessageAsDeleted(
		senderId: string,
		receiverId: string,
		messageId: string,
		type: string
	): Promise<IMessageData> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const { index, message, receiver } = await MessageCache.prototype.getMessage(
				senderId,
				receiverId,
				messageId,
				this.client
			);

			const chatItem = Helpers.parseJson(message) as IMessageData;

			if (type === 'deleteForMe') {
				chatItem.deleteForMe = true;
			} else {
				chatItem.deleteForMe = true;
				chatItem.deleteForEveryone = true;
			}

			await this.client.LSET(
				`messages:${receiver.conversationId}`,
				index,
				JSON.stringify(chatItem)
			);

			const lastMessage: string = (await this.client.LINDEX(
				`messages:${receiver.conversationId}`,
				index
			)) as string;

			return Helpers.parseJson(lastMessage) as IMessageData;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	private async getMessage(
		senderId: string,
		receiverId: string,
		messageId: string,
		client: any
	): Promise<IGetMessageFromCache> {
		const userChatList: string[] = await client.LRANGE(`chatList:${senderId}`, 0, -1);

		const recevier: string = find(userChatList, (listItem: string) =>
			listItem.includes(receiverId)
		) as string;

		const parsedReceiver: IChatList = Helpers.parseJson(recevier) as IChatList;

		const messages: string[] = await client.LRANGE(
			`messages:${parsedReceiver.conversationId}`,
			0,
			-1
		);

		const message: string = find(messages, (item: string) =>
			item.includes(messageId)
		) as string;

		const index: number = findIndex(messages, (message: string) =>
			message.includes(messageId)
		);

		return { index, message, receiver: parsedReceiver };
	}

	public async getUserConversationList(key: string): Promise<IMessageData[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const userChatList: string[] = await this.client.LRANGE(
				`chatList:${key}`,
				0,
				-1
			);

			const conversationChatList: IMessageData[] = [];

			for (const item of userChatList) {
				const chatItem: IChatList = Helpers.parseJson(item) as IChatList;
				const lastMessage: string = (await this.client.LINDEX(
					`messages:${chatItem.conversationId}`,
					-1
				)) as string;

				conversationChatList.push(Helpers.parseJson(lastMessage));
			}

			return conversationChatList;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getChatMessagesFromCache(
		senderId: string,
		receiverId: string
	): Promise<IMessageData[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const userChatList: string[] = await this.client.LRANGE(
				`chatList:${senderId}`,
				0,
				-1
			);

			const receiver: string = find(userChatList, (listItem: string) =>
				listItem.includes(receiverId)
			) as string;

			const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;
			if (parsedReceiver && parsedReceiver.conversationId) {
				const chatMessages: string[] = await this.client.LRANGE(
					`messages:${parsedReceiver.conversationId}`,
					0,
					-1
				);

				return chatMessages.map((message: string) => Helpers.parseJson(message));
			}

			return [];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async addChatUsersToCache(value: IChatUsers): Promise<IChatUsers[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const users: IChatUsers[] = await this.getChatUserList();
			const usersIndex: number = findIndex(
				users,
				(listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value)
			);

			let chatUsers: IChatUsers[] = [];
			if (usersIndex == -1) {
				await this.client.RPUSH('chatUsers', JSON.stringify(value));
				chatUsers = await this.getChatUserList();
			} else {
				chatUsers = users;
			}

			return chatUsers;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async removeChatUsersFromCache(value: IChatUsers): Promise<IChatUsers[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const users: IChatUsers[] = await this.getChatUserList();
			const usersIndex: number = findIndex(
				users,
				(listItem: IChatUsers) => JSON.stringify(listItem) === JSON.stringify(value)
			);

			let chatUsers: IChatUsers[] = [];
			if (usersIndex > -1) {
				await this.client.LREM('chatUsers', usersIndex, JSON.stringify(value));
				chatUsers = await this.getChatUserList();
			} else {
				chatUsers = users;
			}

			return chatUsers;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async updateChatMessages(
		senderId: string,
		receiverId: string
	): Promise<IMessageData> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const userChatList: string[] = await this.client.LRANGE(
				`chatList:${senderId}`,
				0,
				-1
			);

			const receiver: string = find(userChatList, (listItem: string) =>
				listItem.includes(receiverId)
			) as string;

			const parsedReceiver: IChatList = Helpers.parseJson(receiver) as IChatList;

			const messages: string[] = await this.client.LRANGE(
				`messages:${parsedReceiver.conversationId}`,
				0,
				-1
			);

			const unreadMessages: string[] = filter(
				messages,
				(listItem: string) => !Helpers.parseJson(listItem).isRead
			);

			for (const item of unreadMessages) {
				const chatItem = Helpers.parseJson(item) as IMessageData;

				const index = findIndex(messages, (listItem: string) =>
					listItem.includes(`${chatItem._id}`)
				);

				chatItem.isRead = true;

				await this.client.LSET(
					`messages:${chatItem.conversationId}`,
					index,
					JSON.stringify(chatItem)
				);
			}

			const lastMessage: string = (await this.client.LINDEX(
				`messages:${parsedReceiver.conversationId}`,
				-1
			)) as string;

			return Helpers.parseJson(lastMessage) as IMessageData;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server error. Try again.');
		}
	}

	public async updateMessageReaction(
		conversationId: string,
		messageId: string,
		reaction: string,
		senderName: string,
		type: 'add' | 'remove'
	): Promise<IMessageData> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const messages: string[] = await this.client.LRANGE(
				`messages:${conversationId}`,
				0,
				-1
			);

			const messageIndex: number = findIndex(messages, (listItem: string) =>
				listItem.includes(messageId)
			);

			const message: string = (await this.client.LINDEX(
				`messages:${conversationId}`,
				messageIndex
			)) as string;

			const parsedMessage: IMessageData = Helpers.parseJson(message) as IMessageData;

			const reactions: IReaction[] = [];

			if (parsedMessage) {
				remove(
					parsedMessage.reaction,
					(reaction: IReaction) => reaction.senderName === senderName
				);

				if (type === 'add') {
					reactions.push({ senderName, type: reaction });

					parsedMessage.reaction = [...parsedMessage.reaction, ...reactions];

					await this.client.LSET(
						`messages:${conversationId}`,
						messageIndex,
						JSON.stringify(parsedMessage)
					);
				} else {
					await this.client.LSET(
						`messages:${conversationId}`,
						messageIndex,
						JSON.stringify(parsedMessage)
					);
				}
			}

			const updatedMessage: string = (await this.client.LINDEX(
				`messages:${conversationId}`,
				messageIndex
			)) as string;

			return Helpers.parseJson(updatedMessage) as IMessageData;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server error. Try again.');
		}
	}

	private async getChatUserList(): Promise<IChatUsers[]> {
		const chatUserList: IChatUsers[] = [];
		const chatUsers = await this.client.LRANGE('chatUsers', 0, -1);

		for (const user of chatUsers) {
			const chatUser: IChatUsers = Helpers.parseJson(user) as IChatUsers;
			chatUserList.push(chatUser);
		}

		return chatUserList;
	}
}
