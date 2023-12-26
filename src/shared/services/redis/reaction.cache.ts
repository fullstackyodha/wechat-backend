import { ServerError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import { IReaction, IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { config } from '@root/config';
import { BaseCache } from '@service/redis/base.cache';
import Logger from 'bunyan';
import { find } from 'lodash';

const log: Logger = config.createLogger('reactionCache');

export class ReactionCache extends BaseCache {
	constructor() {
		super('reactionCache');
	}

	public async savePostReactionToCache(
		key: string,
		reaction: IReactionDocument,
		postReactions: IReaction,
		type: string,
		previousReaction: string
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			if (previousReaction) {
				this.removePostReactionFromCache(key, reaction.username, postReactions);
			}

			if (type) {
				await this.client.LPUSH(`reactions:${key}`, JSON.stringify(reaction));

				// SAVE NEW REACTION IN POST HASHSET TO {key: value}
				// const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
				await this.client.HSET(
					`posts:${key}`,
					'reactions',
					JSON.stringify(postReactions)
				);
			}
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error.' + error);
		}
	}

	// GET ALL REACTION FOR A SINGLE POST
	public async getReactionFromCache(
		postId: string
	): Promise<[IReactionDocument[], number]> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const reactionCount: number = await this.client.LLEN(`reactions:${postId}`);

			const response: string[] = await this.client.LRANGE(
				`reactions:${postId}`,
				0,
				-1
			);

			const list: IReactionDocument[] = [];
			for (const item of response) {
				list.push(Helpers.parseJson(item));
			}

			return response.length ? [list, reactionCount] : [[], 0];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error.' + error);
		}
	}

	public async getSingleReactionByUsernameFromCache(
		postId: string,
		username: string
	): Promise<[IReactionDocument, number] | []> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const response: string[] = await this.client.LRANGE(
				`reactions:${postId}`,
				0,
				-1
			);

			const list: IReactionDocument[] = [];
			for (const item of response) {
				list.push(Helpers.parseJson(item));
			}

			const result: IReactionDocument | undefined = find(
				list,
				(listItem: IReactionDocument) => {
					return listItem.postId === postId && listItem.username === username;
				}
			);

			return result ? [result, 1] : [];
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error.' + error);
		}
	}

	public async removePostReactionFromCache(
		key: string,
		username: string,
		postReactions: IReaction
	): Promise<void> {
		try {
			if (!this.client.isOpen) {
				await this.client.connect();
			}

			const response: string[] = await this.client.LRANGE(`reactions:${key}`, 0, -1);

			// EXECUTES MULTIPLE COMMANDS
			const multi: ReturnType<typeof this.client.multi> = this.client.multi();

			const userPreviousReaction: IReactionDocument = (await this.getPreviousReaction(
				response,
				username
			)) as IReactionDocument;

			multi.LREM(`reactions:${key}`, 1, JSON.stringify(userPreviousReaction));

			await multi.exec();

			// SAVE NEW REACTION IN POST HASHSET TO {key: value}
			// const dataToSave: string[] = ['reactions', JSON.stringify(postReactions)];
			await this.client.HSET(
				`posts:${key}`,
				'reactions',
				JSON.stringify(postReactions)
			);
		} catch (error) {
			log.error(error);
			throw new ServerError('Server Error.' + error);
		}
	}

	private async getPreviousReaction(
		response: string[],
		username: string
	): Promise<IReactionDocument | undefined> {
		const list: IReactionDocument[] = [];

		// PARSE TO OBJECT
		for (const item of response) {
			list.push(Helpers.parseJson(item) as IReactionDocument);
		}

		// Iterates over elements of collection, returning the first element predicate returns truthy for
		return find(list, (listItem: IReactionDocument) => listItem.username === username);
	}
}
