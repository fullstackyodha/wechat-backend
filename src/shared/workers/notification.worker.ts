import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { notificationService } from '@service/db/notification.service';

const log: Logger = config.createLogger('notificationWorker');

class NotificatioWorker {
	async updateNotificatioToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { key } = job.data;

			await notificationService.updateNotifications(key);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async deleteNotificatioFromDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { key } = job.data;

			await notificationService.deleteNotifications(key);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const notificatioWorker: NotificatioWorker = new NotificatioWorker();
