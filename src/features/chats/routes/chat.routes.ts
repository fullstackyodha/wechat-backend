import { Message } from '@chats/controllers/add-message-reaction';
import { Add } from '@chats/controllers/add_chat_message';
import { Delete } from '@chats/controllers/delete_chat_message';
import { Get } from '@chats/controllers/get_chat_message';
import { Update } from '@chats/controllers/update_chat_message';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import express, { Router } from 'express';

class ChatRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes() {
		this.router.post(
			'/chat/message',
			authMiddleware.checkAuthentication,
			Add.prototype.message
		);

		this.router.get(
			'/chat/message/conversation-list',
			authMiddleware.checkAuthentication,
			Get.prototype.conversationList
		);

		this.router.get(
			'/chat/message/user/:receiverId',
			authMiddleware.checkAuthentication,
			Get.prototype.chatMessages
		);

		this.router.post(
			'/chat/message/add-chat-users',
			authMiddleware.checkAuthentication,
			Add.prototype.addChatUsers
		);

		this.router.post(
			'/chat/message/remove-chat-users',
			authMiddleware.checkAuthentication,
			Add.prototype.removeChatUsers
		);

		this.router.delete(
			'/chat/message/delete/:senderId/:receiverId/:messageId/:type',
			authMiddleware.checkAuthentication,
			Delete.prototype.markMessageAsDelete
		);

		this.router.put(
			'/chat/message/mark-as-read',
			authMiddleware.checkAuthentication,
			Update.prototype.message
		);

		this.router.put(
			'/chat/message/reaction',
			authMiddleware.checkAuthentication,
			Message.prototype.reaction
		);

		return this.router;
	}
}

export const chatRoutes: ChatRoutes = new ChatRoutes();
