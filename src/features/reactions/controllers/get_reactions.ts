import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import { config } from '@root/config';
import { IReactionDocument } from '@reaction/interfaces/reaction.interface';
import { ReactionCache } from '@service/redis/reaction.cache';
import { reactionService } from '@service/db/reaction.service';
import Logger from 'bunyan';
import mongoose from 'mongoose';

const log: Logger = config.createLogger('reaction');

const reactionCache: ReactionCache = new ReactionCache();

export class Get {
	public async reaction(req: Request, res: Response): Promise<void> {
		const { postId } = req.params;

		const cachedReaction: [IReactionDocument[], number] =
			await reactionCache.getReactionFromCache(postId);

		const reactions: [IReactionDocument[], number] = cachedReaction[0].length
			? cachedReaction
			: await reactionService.getReactions(
					{ postId: new mongoose.Types.ObjectId(postId) },
					{ createdAt: -1 }
			  );

		res.status(HTTP_STATUS.OK).json({
			message: 'Post Reactions.',
			reactions: reactions[0],
			count: reactions[1]
		});
	}

	public async singleReactionByUsername(req: Request, res: Response): Promise<void> {
		const { postId, username } = req.params;

		const cachedReaction: [IReactionDocument, number] | [] =
			await reactionCache.getSingleReactionByUsernameFromCache(postId, username);

		const reactions: [IReactionDocument, number] | [] = cachedReaction.length
			? cachedReaction
			: await reactionService.getSinglePostReactionByUsername(postId, username);

		res.status(HTTP_STATUS.OK).json({
			message: 'Single Post Reaction bny Username.',
			reactions: reactions.length ? reactions[0] : [],
			count: reactions.length ? reactions[1] : 0
		});
	}

	public async reactionByUsername(req: Request, res: Response): Promise<void> {
		const { username } = req.params;

		const reactions: IReactionDocument[] =
			await reactionService.getReactionByUsername(username);

		res.status(HTTP_STATUS.OK).json({
			message: 'Get All Reaction by Username.',
			reactions: reactions
		});
	}
}
