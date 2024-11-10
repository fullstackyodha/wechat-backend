import {
	INotification,
	INotificationDocument
} from '@notifications/interfaces/notification.interface';
import { config } from '@root/config';
import { notificationService } from '@service/db/notification.service';
import Logger from 'bunyan';
import mongoose, { model, Schema, Model } from 'mongoose';

const log: Logger = config.createLogger('Nnotification Schema');

const notificationSchema: Schema = new Schema({
	userTo: { type: mongoose.Types.ObjectId, ref: 'User', index: true },
	userFrom: { type: mongoose.Types.ObjectId, ref: 'User' },
	message: { type: String, default: '' },
	read: { type: Boolean, default: false },
	notificationType: { type: String, default: '' },
	entityId: { type: mongoose.Schema.Types.ObjectId },
	createdItemId: { type: mongoose.Schema.Types.ObjectId },
	comment: { type: String, default: '' },
	reaction: { type: String, default: '' },
	post: { type: String, default: '' },
	imgId: { type: String, default: '' },
	imgVersion: { type: String, default: '' },
	gifUrl: { type: String, default: '' },
	createdAt: { type: Date, default: Date.now() }
});

notificationSchema.methods.insertNotification = async function (body: INotification) {
	const {
		userTo,
		userFrom,
		message,
		read,
		notificationType,
		entityId,
		createdItemId,
		comment,
		reaction,
		post,
		imgId,
		imgVersion,
		gifUrl,
		createdAt
	} = body;

	// ADD TO THE COLLECTOIN
	await NotificationModel.create({
		userTo,
		userFrom,
		message,
		read,
		notificationType,
		entityId,
		createdItemId,
		comment,
		reaction,
		post,
		imgId,
		imgVersion,
		gifUrl,
		createdAt
	});

	try {
		const notification: INotificationDocument[] =
			await notificationService.getNotifications(userTo);

		return notification;
	} catch (err) {
		log.error(err);
	}
};

export const NotificationModel: Model<INotificationDocument> =
	model<INotificationDocument>('Notification', notificationSchema, 'Notification');
