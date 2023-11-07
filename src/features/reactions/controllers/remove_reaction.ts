import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { config } from '@root/config';
import { IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import Logger from 'bunyan';
import { reactionQueue } from '@service/queues/reaction.queue';
import { removeReactionSchema } from '@reaction/schemes/reactions';

const log: Logger = config.createLogger('reaction');

const reactionCache: ReactionCache = new ReactionCache();

export class Remove {
	@joiValidation(removeReactionSchema)
	public async reaction(req: Request, res: Response): Promise<void> {
		const { postId, previousReaction, postReactions } = req.params;

		await reactionCache.removePostReactionFromCache(
			postId,
			`${req.currentUser!.username}`,
			JSON.parse(postReactions)
		);

		// CREATING REACTION OBJ TO SAVE IN DB
		const databaseReactionData: IReactionJob = {
			postId,
			username: req.currentUser!.username,
			previousReaction
		};

		reactionQueue.addReactionJob('removeReactionFromDB', databaseReactionData);

		res.status(HTTP_STATUS.OK).json({ message: 'Reaction Removed Successfully.' });
	}
}
