import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import HTTP_STATUS from 'http-status-codes';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { config } from '@root/config';
import { addReactionSchema } from '@reaction/schemes/reactions';
import { IReactionDocument, IReactionJob } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import Logger from 'bunyan';
import { reactionQueue } from '@service/queues/reaction.queue';

const log: Logger = config.createLogger('reaction');

const reactionCache: ReactionCache = new ReactionCache();

export class Add {
	@joiValidation(addReactionSchema)
	public async reaction(req: Request, res: Response): Promise<void> {
		const { userTo, postId, type, profilePicture, previousReaction, postReactions } =
			req.body;

		// CREATING REACTION OBJECT TO SAVE IN CACHE
		const reactionObject: IReactionDocument = {
			_id: new ObjectId(),
			postId,
			type,
			userTo,
			username: req.currentUser?.username,
			avataColor: req.currentUser?.avatarColor,
			profilePicture
		} as IReactionDocument;

		// SAVE REACTION IN CACHE
		await reactionCache.savePostReactionToCache(
			postId,
			reactionObject,
			postReactions,
			type,
			previousReaction
		);

		// CREATING REACTION OBJ TO SAVEIN DB
		const databaseReactionData: IReactionJob = {
			postId,
			userTo,
			userFrom: req.currentUser!.userId,
			username: req.currentUser!.username,
			previousReaction,
			type,
			reactionObject
		};

		// ADDING IT INTO THE QUEUE
		reactionQueue.addReactionJob('addReactionToDB', databaseReactionData);

		res.status(HTTP_STATUS.OK).json({ message: 'Reaction Added Successfully.' });
	}
}
