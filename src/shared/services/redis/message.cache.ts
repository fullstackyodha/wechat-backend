import { BaseCache } from './base.cache';
import Logger from 'bunyan';
import { config } from '@root/config';
import { ServerError } from '@global/helpers/error_handler';
import { find, findIndex } from 'lodash';
import { IChatList, IChatUsers, IMessageData } from '@chats/interfaces/chat.interface';
import { Helpers } from '@global/helpers/helpers';

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
