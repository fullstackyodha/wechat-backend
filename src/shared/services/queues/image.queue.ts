import { IFileImageJobData } from '@images/interfaces/image.interface';
import { BaseQueue } from './base.queue';
import { imageWorker } from '@worker/image.worker';

class ImageQueue extends BaseQueue {
	constructor() {
		super('image');
		this.processJob('addUserProfileImageToDB', 5, imageWorker.addUserProfileImageToDB);
		this.processJob('updateBgImageToDB', 5, imageWorker.updateBgImageToDB);
		this.processJob('addImageToDB', 5, imageWorker.addImageToDB);
		this.processJob('removeImageFromDB', 5, imageWorker.removeImageFromDB);
	}

	public addImageJob(name: string, data: IFileImageJobData): void {
		this.addJob(name, data);
	}
}

export const imageQueue: ImageQueue = new ImageQueue();
