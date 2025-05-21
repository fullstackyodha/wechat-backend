import { IMessageData } from '@chats/interfaces/chat.interface';
import { IConvertionDocument } from '@chats/interfaces/conversation.interface';
import { MessageModel } from '@chats/models/chat.schema';
import { ConversationModel } from '@chats/models/conversation.schema';

class ChatService {
	public async addMessageToDB(data: IMessageData): Promise<void> {
		const conversation: IConvertionDocument[] = await ConversationModel.find({
			_id: data?.conversationId
		}).exec();

		if (!conversation.length) {
			await ConversationModel.create({
				_id: data?.conversationId,
				senderId: data?.senderId,
				receiverId: data?.receiverId
			});
		}

		await MessageModel.create({
			_id: data._id,
			conversationId: data.conversationId,
			receiverId: data?._id,
			receiverUsername: data?.receiverUsername,
			receiverAvatarColor: data?.receiverAvatarColor,
			receiverProfilePicture: data?.receiverProfilePicture,
			senderUsername: data?.senderUsername,
			senderId: data?.senderId,
			senderAvatarColor: data?.senderAvatarColor,
			senderProfilePicture: data?.senderProfilePicture,
			body: data?.body,
			isRead: data?.isRead,
			gifUrl: data?.gifUrl,
			selectedImage: data?.selectedImage,
			reaction: data?.reaction,
			createdAt: data?.createdAt
		});
	}
}

export const chatService: ChatService = new ChatService();
