import { ServerError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import Logger from 'bunyan';

const log: Logger = config.createLogger('userCache');

export class UserCache extends BaseCache {
	constructor() {
		super('userCache');
	}

	public async saveUserToCache(
		key: string,
		userUId: string,
		createdUser: IUserDocument
	): Promise<void> {
		const createdAt = new Date();

		const {
			_id,
			uId,
			username,
			email,
			avatarColor,
			postsCount,
			blocked,
			blockedBy,
			profilePicture,
			followersCount,
			notifications,
			followingCount,
			social,
			quote,
			work,
			school,
			location,
			bgImageVersion,
			bgImageId
		} = createdUser;

		const firstList: string[] = [
			'_id',
			`${_id}`,
			'uId',
			`${uId}`,
			'username',
			`${username}`,
			'email',
			`${email}`,
			'avatarColor',
			`${avatarColor}`,
			'postsCount',
			`${postsCount}`,
			'createdAt',
			`${createdAt}`
		];

		const secondList: string[] = [
			'blocked',
			`${JSON.stringify(blocked)}`,
			'blockedBy',
			`${JSON.stringify(blockedBy)}`,
			'profilePitcure',
			`${profilePicture}`,
			'followersCount',
			`${followersCount}`,
			'followingCount',
			`${followingCount}`,
			'notifications',
			`${JSON.stringify(notifications)}`,
			'social',
			`${JSON.stringify(social)}`
		];

		const thirdList: string[] = [
			'work',
			`${work}`,
			'location',
			`${location}`,
			'school',
			`${school}`,
			'quote',
			`${quote}`,
			'bgImageVersion',
			`${bgImageVersion}`,
			'bgImageId',
			`${bgImageId}`
		];

		const dataToSave: string[] = [...firstList, ...secondList, ...thirdList];

		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// Create a user set and add a member with score = uid and value = key(userObjectId)
			await this.client.ZADD('users', {
				score: parseInt(userUId, 10),
				value: `${key}`
			});

			// Add member to HASH with key = users:userObejctId & value as created userData
			await this.client.HSET(`users:${key}`, dataToSave);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}

	public async getUserFromCache(userId: string): Promise<IUserDocument | null> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const response: IUserDocument = (await this.client.HGETALL(
				`users:${userId}`
			)) as unknown as IUserDocument;

			response.createdAt = new Date(Helpers.parseJson(`${response.createdAt}`));
			response.postsCount = Helpers.parseJson(`${response.postsCount}`);
			response.blocked = Helpers.parseJson(`${response.blocked}`);
			response.blockedBy = Helpers.parseJson(`${response.blockedBy}`);
			// response.work = Helpers.parseJson(`${response.work}`);
			// response.school = Helpers.parseJson(`${response.school}`);
			// response.location = Helpers.parseJson(`${response.location}`);
			// response.quote = Helpers.parseJson(`${response.quote}`);
			response.notifications = Helpers.parseJson(`${response.notifications}`);
			response.social = Helpers.parseJson(`${response.social}`);
			response.followersCount = Helpers.parseJson(`${response.followersCount}`);
			response.followingCount = Helpers.parseJson(`${response.followingCount}`);

			return response;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		}
	}
}
