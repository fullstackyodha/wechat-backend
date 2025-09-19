import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { ServerError } from '@global/helpers/error_handler';
import {
	IPostDocument,
	IReactions,
	ISavePostToCache
} from '@post/interfaces/post.interface';
import { Helpers } from '@global/helpers/helpers';

const log: Logger = config.createLogger('postCache');

// CREATING A MULTI TYPE
export type PostCacheMultiType =
	| string
	| number
	| Buffer
	| IPostDocument
	| IPostDocument[];

export class PostCache extends BaseCache {
	constructor() {
		super('postCache');
	}

	public async savePostToCache(data: ISavePostToCache): Promise<void> {
		const { key, currentUserId, uId, createdPost } = data;

		const {
			_id,
			userId,
			username,
			email,
			avatarColor,
			profilePicture,
			post,
			bgColor,
			commentsCount,
			imgVersion,
			imgId,
			feelings,
			gifUrl,
			privacy,
			reactions,
			createdAt
		} = createdPost;

		// const firstList: string[] = [
		// 	'_id',
		// 	`${_id}`,
		// 	'userId',
		// 	`${userId}`,
		// 	'username',
		// 	`${username}`,
		// 	'email',
		// 	`${email}`,
		// 	'avatarColor',
		// 	`${avatarColor}`,
		// 	'profilePicture',
		// 	`${profilePicture}`,
		// 	'post',
		// 	`${post}`,
		// 	'bgColor',
		// 	`${bgColor}`,
		// 	'feelings',
		// 	`${feelings}`,
		// 	'gifUrl',
		// 	`${gifUrl}`,
		// 	'privacy',
		// 	`${privacy}`
		// ];

		// const secondList: string[] = [
		// 	'commentsCount',
		// 	`${commentsCount}`,
		// 	'imgVersion',
		// 	`${imgVersion}`,
		// 	'imgId',
		// 	`${imgId}`,
		// 	'reactions',
		// 	JSON.stringify(reactions),
		// 	'createdAt',
		// 	`${createdAt}`
		// ];

		// const dataToSave: string[] = [...firstList, ...secondList];

		const dataToSave = {
			_id: `${_id}`,
			userId: `${userId}`,
			username: `${username}`,
			email: `${email}`,
			avatarColor: `${avatarColor}`,
			profilePicture: `${profilePicture}`,
			post: `${post}`,
			bgColor: `${bgColor}`,
			feelings: `${feelings}`,
			gifUrl: `${gifUrl}`,
			privacy: `${privacy}`,
			commentsCount: `${commentsCount}`,
			imgVersion: `${imgVersion}`,
			imgId: `${imgId}`,
			reactions: JSON.stringify(reactions),
			createdAt: `${createdAt}`
		};

		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// GET THE USER WITH CURRENTUSER ID AND GET THE POST COUNT PROP
			const postsCount: (string | null)[] = await this.client.HMGET(
				`users:${currentUserId}`,
				'postsCount'
			);

			// EXECUTES MULTIPLE COMMANDS
			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			multi.ZADD('posts', { score: parseInt(uId, 10), value: `${key}` });

			for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
				multi.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
			}

			// INCREMENT POST COUNT
			const count: number = parseInt(postsCount[0] ?? '0', 10) + 1;

			// UPDATE POST COUNT OF THE USER
			multi.HSET(`users:${currentUserId}`, 'postsCount', count);

			multi.exec();
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getPostsFromCache(
		key: string,
		start: number,
		end: number
	): Promise<IPostDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// DISPLAY THE LATEST POST REV = REVERSE
			const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			for (const value of reply) {
				multi.HGETALL(`posts:${value}`);
			}

			const replies: PostCacheMultiType =
				(await multi.exec()) as unknown as PostCacheMultiType;

			const postReplies: IPostDocument[] = [];
			for (const post of replies as IPostDocument[]) {
				post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
				post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
				post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;

				postReplies.push(post);
			}

			return postReplies;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getPostsWithImagesFromCache(
		key: string,
		start: number,
		end: number
	): Promise<IPostDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// DISPLAY THE LATEST POST REV = REVERSE
			const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			for (const value of reply) {
				multi.HGETALL(`posts:${value}`);
			}

			const replies: PostCacheMultiType =
				(await multi.exec()) as unknown as PostCacheMultiType;

			const postWithImages: IPostDocument[] = [];
			for (const post of replies as IPostDocument[]) {
				if ((post.imgId && post.imgVersion) || post.gifUrl) {
					post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
					post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
					post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;

					postWithImages.push(post);
				}
			}

			return postWithImages;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getUserPostFromCache(key: string, uId: number): Promise<IPostDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// DISPLAY THE LATEST POST REV = REVERSE
			const reply: string[] = await this.client.ZRANGE(key, uId, uId, {
				REV: true,
				BY: 'SCORE'
			});

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			for (const value of reply) {
				multi.HGETALL(`posts:${value}`);
			}

			const replies: PostCacheMultiType =
				(await multi.exec()) as unknown as PostCacheMultiType;

			const postReplies: IPostDocument[] = [];
			for (const post of replies as IPostDocument[]) {
				// if ((post.imgId && post.imgVersion) || post.gifUrl) {
				post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
				post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
				post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;

				postReplies.push(post);
				// }
			}

			return postReplies;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getTotalPostsInCache(): Promise<number> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const count: number = await this.client.ZCARD('posts');

			return count;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getTotalUserPostsInCache(uId: number): Promise<number> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const count: number = await this.client.ZCOUNT('posts', uId, uId);

			return count;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async updatePostInCache(
		key: string,
		updatedPost: IPostDocument
	): Promise<IPostDocument> {
		// Destructure updatedPost
		const {
			post,
			bgColor,
			feelings,
			privacy,
			gifUrl,
			imgVersion,
			imgId,
			videoId,
			videoVersion,
			profilePicture
		} = updatedPost;

		const dataToSave = {
			post: `${post}`,
			bgColor: `${bgColor}`,
			feelings: `${feelings}`,
			privacy: `${privacy}`,
			gifUrl: `${gifUrl}`,
			profilePicture: `${profilePicture}`,
			imgVersion: `${imgVersion}`,
			imgId: `${imgId}`,
			videoId: `${videoId}`,
			videoVersion: `${videoVersion}`
		};

		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// UPDATE WITH CHANGED DATA
			for (const [itemKey, itemValue] of Object.entries(dataToSave)) {
				await this.client.HSET(`posts:${key}`, `${itemKey}`, `${itemValue}`);
			}

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			// GET THE RECENT UPDATED DATA
			multi.HGETALL(`posts:${key}`);

			const reply: PostCacheMultiType =
				(await multi.exec()) as unknown as PostCacheMultiType;

			const postReply = reply as IPostDocument[];

			postReply[0].commentsCount = Helpers.parseJson(
				`${postReply[0].commentsCount}`
			) as number;

			postReply[0].reactions = Helpers.parseJson(
				`${postReply[0].reactions}`
			) as IReactions;

			postReply[0].createdAt = new Date(
				Helpers.parseJson(`${postReply[0].createdAt}`)
			) as Date;

			return postReply[0];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	public async getPostsWithVideosFromCache(
		key: string,
		start: number,
		end: number
	): Promise<IPostDocument[]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const reply: string[] = await this.client.ZRANGE(key, start, end, { REV: true });
			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			for (const value of reply) {
				multi.HGETALL(`posts:${value}`);
			}

			const replies: PostCacheMultiType =
				(await multi.exec()) as unknown as PostCacheMultiType;

			const postWithVideos: IPostDocument[] = [];
			for (const post of replies as IPostDocument[]) {
				// CHECK IF POST HAS VIDEO ID AND VIDEO VERSION
				if (post.videoId && post.videoVersion) {
					post.commentsCount = Helpers.parseJson(`${post.commentsCount}`) as number;
					post.reactions = Helpers.parseJson(`${post.reactions}`) as IReactions;
					post.createdAt = new Date(Helpers.parseJson(`${post.createdAt}`)) as Date;

					postWithVideos.push(post);
				}
			}

			return postWithVideos;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server error. Try again.');
		}
	}

	public async deletePostFromCache(key: string, currentUserId: string): Promise<number> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			// GET THE POST COUNT OF USER WITH USERID
			const postCount: (string | null)[] = await this.client.HMGET(
				`users:${currentUserId}`,
				'postCount'
			);

			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			// REMOVE THE VALUE OF SORTED SET
			multi.ZREM('posts', `${key}`);

			multi.DEL(`posts:${key}`);
			multi.DEL(`comments:${key}`);
			multi.DEL(`reactions:${key}`);

			const count: number = parseInt(postCount[0] ?? '0', 10) - 1;
			multi.HSET(`users:${currentUserId}`, ['postsCount', count]);
			await multi.exec();

			return 0;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}
}
