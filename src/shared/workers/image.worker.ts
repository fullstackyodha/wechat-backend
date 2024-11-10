import { Job, DoneCallback } from 'bull';
import Logger from 'bunyan';
import { config } from '@root/config';
import { imageService } from '@service/db/image.service';

const log: Logger = config.createLogger('imageWorker');

class ImageWorker {
	async addUserProfileImageToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { key, value, imgId, imgVersion } = job.data;

			await imageService.addUserProfileImageToDB(key, value, imgId, imgVersion);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async updateBgImageToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { key, imgId, imgVersion } = job.data;

			await imageService.addUserBackgroundImageToDB(key, imgId, imgVersion);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async addImageToDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { key, imgId, imgVersion } = job.data;

			await imageService.addImage(key, imgId, imgVersion, '');

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}

	async removeImageFromDB(job: Job, done: DoneCallback): Promise<void> {
		try {
			const { imageId } = job.data;

			await imageService.removeImageFromDB(imageId);

			// Report progress on a job
			job.progress(100);

			done(null, job.data);
		} catch (error) {
			log.error(error);
			done(error as Error);
		}
	}
}

export const imageWorker: ImageWorker = new ImageWorker();
