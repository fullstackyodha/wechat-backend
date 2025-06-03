import { IEmailJob } from '@user/interfaces/user.interface';
import { BaseQueue } from './base.queue';
import { emailWorker } from '@worker/email.worker';

class EmailQueue extends BaseQueue {
	constructor() {
		super('email');
		this.processJob('forgotPassword', 5, emailWorker.addNotificationEmail);
		this.processJob('commentEmail', 5, emailWorker.addNotificationEmail);
		this.processJob('connectionEmail', 5, emailWorker.addNotificationEmail);
		this.processJob('reactionEmail', 5, emailWorker.addNotificationEmail);
		this.processJob('directMessageEmail', 5, emailWorker.addNotificationEmail);
		this.processJob('changePassword', 5, emailWorker.addNotificationEmail);
	}

	public addEmailJob(name: string, data: IEmailJob): void {
		this.addJob(name, data);
	}
}

export const emailQueue: EmailQueue = new EmailQueue();
