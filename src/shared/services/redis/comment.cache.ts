import {
	ICommentDocument,
	ICommentNameList
} from '@comments/interfaces/comment.interface';
import { ServerError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import { BaseCache } from './base.cache';
import { config } from '@root/config';

import Logger from 'bunyan';
import { find } from 'lodash';

const log: Logger = config.createLogger('commentCache');

export class CommentCache extends BaseCache {
	constructor() {
		super('commentCache');
	}

	// ADD POST COMMENT TO CACHE
	public async savePostCommentToCache(postId: string, value: string): Promise<void> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}

			await this.client.LPUSH(`comments:${postId}`, value);

			// GET THE POST WITH POSTID AND GET THE COMMENT COUNT PROP
			const commentsCount: string[] = await this.client.HMGET(
				`posts:${postId}`,
				'commentsCount'
			);

			// INCREMENT POST COUNT
			const count: number = parseInt(commentsCount[0], 10) + 1;

			// SAVE THE NEW INCREMENTED POST COUNT AT THE POSTID
			await this.client.HSET(`posts:${postId}`, 'commentsCount', `${count}`);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	// GET POST COMMENT FROM CACHE
	public async getPostCommentsFromCache(postId: string): Promise<ICommentDocument[]> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}

			const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

			const list: ICommentDocument[] = [];

			for (const item of comments) {
				list.push(Helpers.parseJson(item));
			}

			return list;
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	// GET POST COMMENT NAMES FROM CACHE
	public async getSingleCommentFromCache(
		postId: string,
		commentId: string
	): Promise<ICommentDocument[]> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}

			const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

			const list: ICommentDocument[] = [];

			for (const item of comments) {
				list.push(Helpers.parseJson(item));
			}

			const result: ICommentDocument = find(
				list,
				(listItem: ICommentDocument) => listItem._id === commentId
			) as ICommentDocument;

			return [result];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	// GET POST COMMENT NAMES FROM CACHE
	public async getCommentNamesFromCache(postId: string): Promise<ICommentNameList[]> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}

			const commentsLength: number = await this.client.LLEN(`comments:${postId}`);

			const comments: string[] = await this.client.LRANGE(`comments:${postId}`, 0, -1);

			const list: string[] = [];

			for (const item of comments) {
				const comment: ICommentDocument = Helpers.parseJson(item) as ICommentDocument;
				list.push(comment.username);
			}

			const response: ICommentNameList = { count: commentsLength, names: list };

			return [response];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error. Try Again!!!');
		} finally {
			if (this.client.isOpen) {
				await this.client.quit();
			}
		}
	}

	// DELETE POST COMMENT FROM CACHE
	// postId: string,
	// commentId: string
	public async deletePostCommentFromCache(): Promise<void> {
		try {
			if (!this.client.connect()) {
				this.client.connect();
			}
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
