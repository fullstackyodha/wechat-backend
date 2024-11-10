import {
	INotification,
	INotificationDocument
} from '@notifications/interfaces/notification.interface';
import { notificationService } from '@service/db/notification.service';
import { notificationQueue } from '@service/queues/notification.queue';
import { socketIONotificationObject } from '@socket/notifications';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

export class Notifications {
	public async getNotifications(req: Request, res: Response): Promise<void> {
		const notifications: INotificationDocument[] =
			await notificationService.getNotifications(req.currentUser!.userId);

		res.status(HTTP_STATUS.OK).json({
			message: 'User Notification Fetched Successfully.',
			notifications
		});
	}

	public async updateNotifications(req: Request, res: Response): Promise<void> {
		const { notificationId } = req.params;

		socketIONotificationObject.emit('update notification', notificationId);

		notificationQueue.addNotificationJob('updateNotification', { key: notificationId });

		res.status(HTTP_STATUS.OK).json({ message: 'Notification Updated Successfully.' });
	}

	public async deleteNotifications(req: Request, res: Response): Promise<void> {
		const { notificationId } = req.params;

		socketIONotificationObject.emit('delete notification', notificationId);

		notificationQueue.addNotificationJob('deleteNotification', { key: notificationId });

		res.status(HTTP_STATUS.OK).json({ message: 'Notification Deleted Successfully.' });
	}
}
