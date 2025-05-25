import { IMessageData } from '@chats/interfaces/chat.interface';
import { IConvertionDocument } from '@chats/interfaces/conversation.interface';
import { MessageModel } from '@chats/models/chat.schema';
import { ConversationModel } from '@chats/models/conversation.schema';
import { ObjectId } from 'mongodb';

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

	public async getUserConversationList(userId: ObjectId): Promise<IMessageData[]> {
		const messages: IMessageData[] = await MessageModel.aggregate([
			{
				$match: {
					$or: [{ receiverId: userId }, { senderId: userId }]
				}
			},
			{
				$group: {
					_id: '$conversationId',
					result: {
						// Picks the last document in each group (in pipeline order)
						$last: '$$ROOT' // ROOT: Refers to the entire original document
					}
				}
			},
			{
				$project: {
					_id: '$result._id',
					conversationId: '$result.conversationId',
					receiverId: '$result.receiverId',
					receiverUsername: '$result.receiverUsername',
					receiverAvatarColor: '$result.receiverAvatarColor',
					receiverProfilePicture: '$result.receiverProfilePicture',
					body: '$result.body',
					gifUrl: '$result.gifUrl',
					isRead: '$result.isRead',
					senderUsername: '$result.senderUsername',
					senderId: '$result.senderId',
					senderAvatarColor: '$result.senderAvatarColor',
					senderProfilePicture: '$result.senderProfilePicture',
					selectedImage: '$result.selectedImage',
					reaction: '$result.reaction',
					createdAt: '$result.createdAt'
				}
			},
			{
				$sort: {
					createdAt: 1
				}
			}
		]);

		/* Example Output
			| conversationId | senderId | receiverId | text         | createdAt           |
			| -------------- | -------- | ---------- | ------------ | ------------------- |
			| A              | U1       | U2         | "Hello"      | 2024-01-01 10:00:00 |
			| A              | U2       | U1         | "Hi"         | 2024-01-01 10:01:00 |
			| B              | U1       | U3         | "Hey there"  | 2024-01-02 12:00:00 |
			| B              | U3       | U1         | "What's up?" | 2024-01-02 12:05:00 |

			[
				{
					_id: "A",
					result: {
					conversationId: "A",
					senderId: "U2",
					receiverId: "U1",
					text: "Hi",
					createdAt: "2024-01-01 10:01:00"
					}
				},
				{
					_id: "B",
					result: {
					conversationId: "B",
					senderId: "U3",
					receiverId: "U1",
					text: "What's up?",
					createdAt: "2024-01-02 12:05:00"
					}	
				}
			]

		*/

		return messages;
	}

	public async getMessages(
		senderId: ObjectId,
		receiverId: ObjectId,
		sort: Record<string, 1 | -1>
	): Promise<IMessageData[]> {
		const query = {
			$or: [
				{
					senderId: senderId,
					receiverId: receiverId
				},
				{
					senderId: receiverId,
					receiverId: senderId
				}
			]
		};

		const messages: IMessageData[] = await MessageModel.aggregate([
			{ $match: query },
			{ $sort: sort }
		]);

		return messages;
	}

	public async markMessageAsDeleted(messageId: ObjectId, type: string): Promise<void> {
		if (type === 'deleteForMe') {
			await MessageModel.findOneAndUpdate(
				{ _id: messageId },
				{ $set: { deleteForMe: true } }
			).exec();
		} else {
			await MessageModel.findOneAndUpdate(
				{ _id: messageId },
				{ $set: { deleteForMe: true, deleteForEveryone: true } }
			).exec();
		}
	}
}

export const chatService: ChatService = new ChatService();
