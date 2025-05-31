import { DoneCallback, Job } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { mailTransport } from '@service/email/mail-transport';

const log: Logger = config.createLogger('emailWorker');

class EmailWorker {
	async addNotificationEmail(job: Job, done: DoneCallback): Promise<void> {
		try {
			// extracting user data from the job
			const { receiverEmail, subject, template } = job.data;

			// Send the mail to the user
			await mailTransport.sendEmail(receiverEmail, subject, template);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const emailWorker: EmailWorker = new EmailWorker();
