import { IMessageData, IMessageNotification } from '@chats/interfaces/chat.interface';
import { addChatSchema } from '@chats/schemes/chat';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { BadRequestError } from '@global/helpers/error_handler';
import { INotificationTemplate } from '@notifications/interfaces/notification.interface';
import { config } from '@root/config';
import { notificationTemplate } from '@service/email/templates/notifications/notification.template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { MessageCache } from '@service/redis/message.cache';
import { socketIOChatObject } from '@socket/chat';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UploadApiResponse } from 'cloudinary';
import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTPS_STATUS from 'http-status-codes';
import mongoose from 'mongoose';
import { chatQueue } from '@service/queues/chat.queue.';

const userCache: UserCache = new UserCache();
const messageCache: MessageCache = new MessageCache();

export class Add {
	@joiValidation(addChatSchema)
	public async message(req: Request, res: Response): Promise<void> {
		const {
			conversationId,
			receiverId,
			receiverUsername,
			receiverAvatarColor,
			receiverProfilePicture,
			body,
			gifUrl,
			isRead,
			selectedImage
		} = req.body;

		// Create Message Object Id
		const messageObjectId: ObjectId = new ObjectId();
		// Create Conversation Object Id or use conversationId
		const conversationObjectId: ObjectId | mongoose.Types.ObjectId = conversationId
			? new mongoose.Types.ObjectId(conversationId)
			: new ObjectId();

		// Get Current User(Sender) from Cache
		const sender: IUserDocument = (await userCache.getUserFromCache(
			`${req.currentUser!.userId}`
		)) as IUserDocument;

		let fileUrl = '';

		if (selectedImage.length) {
			const result: UploadApiResponse = (await uploads(
				req.body.image,
				req.currentUser?.userId,
				true,
				true
			)) as UploadApiResponse;

			if (!result.public_id) {
				throw new BadRequestError(result.message);
			}

			fileUrl = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${result.public_id}`;
		}

		// Create Message Data
		const messageData: IMessageData = {
			_id: `${messageObjectId}`,
			conversationId: new mongoose.Types.ObjectId(conversationObjectId),
			receiverId,
			receiverUsername,
			receiverAvatarColor,
			receiverProfilePicture,
			body,
			gifUrl,
			isRead,
			senderUsername: `${req.currentUser!.username}`,
			senderId: `${req.currentUser!.userId}`,
			senderAvatarColor: `${req.currentUser!.avatarColor}`,
			senderProfilePicture: `${sender.profilePicture}`,
			selectedImage: fileUrl,
			reaction: [],
			createdAt: new Date(),
			deleteForEveryone: false,
			deleteForMe: false
		};

		// Emit Event
		Add.prototype.emitSocketIOEvent(messageData);

		// If both users are not on the same chat page send email
		if (!isRead) {
			Add.prototype.messageNotification({
				currentUser: req.currentUser!,
				message: body,
				receiverName: receiverUsername,
				receiverId,
				messageData
			});
		}

		// ADD SENDER TO CONVERSATION LIST
		await messageCache.addChatlistToCache(
			`${req.currentUser!.userId}`,
			`${receiverId}`,
			`${conversationObjectId}`
		);

		// ADD RECEIVER TO CONVERSATION LIST
		await messageCache.addChatlistToCache(
			`${receiverId}`,
			`${req.currentUser!.userId}`,
			`${conversationObjectId}`
		);

		// ADD MESSAGE DATA TO CACHE
		await messageCache.addChatMessageToCache(`${conversationObjectId}`, messageData);

		// ADD MESSAGE DATA TO QUEUE
		chatQueue.addChatMessageJob('addChatMessageToDB', messageData);

		res.status(HTTPS_STATUS.OK).json({
			message: 'Message sent successfully.',
			conversationId: conversationObjectId
		});
	}

	public async addChatUsers(req: Request, res: Response): Promise<void> {
		const chatUsers = await messageCache.addChatUsersToCache(req.body);

		socketIOChatObject.emit('add chat users', chatUsers);

		res.status(HTTPS_STATUS.OK).json({
			message: 'Users Added to Chat List Successfully'
		});
	}

	public async removeChatUsers(req: Request, res: Response): Promise<void> {
		const chatUsers = await messageCache.removeChatUsersFromCache(req.body);

		socketIOChatObject.emit('add chat users', chatUsers);

		res.status(HTTPS_STATUS.OK).json({
			message: 'Users Removed to Chat List Successfully'
		});
	}

	private emitSocketIOEvent(data: IMessageData): void {
		socketIOChatObject.emit('message received', data);
		socketIOChatObject.emit('chat list', data);
	}

	private async messageNotification({
		currentUser,
		message,
		receiverName,
		receiverId
	}: IMessageNotification): Promise<void> {
		const cachedUser: IUserDocument = (await userCache.getUserFromCache(
			`${receiverId}`
		)) as IUserDocument;

		// CHECK IF USER HAS ENABLED MESSAGE NOTIFICATION
		if (cachedUser.notifications.messages) {
			// SEND TO EMAIL QUEUE
			const templateParams: INotificationTemplate = {
				username: receiverName,
				message,
				header: `New Message Notification from ${currentUser.username}`
			};

			const template: string =
				notificationTemplate.notificationMessageTemplate(templateParams);

			emailQueue.addEmailJob('directMessageEmail', {
				receiverEmail: cachedUser.email!,
				template,
				subject: `You received a message from ${currentUser.username}`
			});
		}
	}
}
