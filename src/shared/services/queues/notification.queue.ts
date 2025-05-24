import { INotificationJobData } from '@notifications/interfaces/notification.interface';
import { BaseQueue } from './base.queue';
import { notificatioWorker } from '@worker/notification.worker';

class NotificationQueue extends BaseQueue {
	constructor() {
		super('notifications');
		this.processJob('updateNotification', 5, notificatioWorker.updateNotificatioToDB);
		this.processJob('deleteNotification', 5, notificatioWorker.deleteNotificatioFromDB);
	}

	public addNotificationJob(name: string, data: INotificationJobData): void {
		this.addJob(name, data);
	}
}

export const notificationQueue: NotificationQueue = new NotificationQueue();
