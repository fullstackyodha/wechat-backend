import { Helpers } from '@global/helpers/helpers';
import { PostModel } from '@post/models/post.schema';
import {
	IQueryReaction,
	IReactionDocument,
	IReactionJob
} from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { UserCache } from '@service/redis/user.cache';
import { omit } from 'lodash';
import mongoose from 'mongoose';

const userCache = new UserCache();

class ReactionService {
	public async addReactionDataToDB(reactionData: IReactionJob): Promise<void> {
		const {
			postId,
			username,
			userTo,
			userFrom,
			type,
			previousReaction,
			reactionObject
		} = reactionData;

		let updatedReactionObject: IReactionDocument = reactionObject as IReactionDocument;

		// REMOVING ID IF REACTION ALREADY PRESENT
		if (previousReaction) {
			updatedReactionObject = omit(reactionObject, ['_id']);
		}

		// [IUserDocument, IReactionDocument, IPostDocument]
		const updatedReaction = await Promise.all([
			userCache.getUserFromCache(`users:${userTo}`),

			// Finds the first document that matches filter and replaces it with new reaction.
			ReactionModel.replaceOne(
				{ postId, type: previousReaction, username },
				updatedReactionObject,
				{ upsert: true }
			),

			// DECREMENT PREVIOUS REACTION TO 0 & INCREMENT NEW REACTION TO 1
			PostModel.findOneAndUpdate(
				{ _id: postId },
				{
					$inc: {
						[`reactions.${previousReaction}`]: -1,
						[`reactions.${type}`]: 1
					}
				},
				{ new: true }
			)
		]);

		// SEND REACTION NOTIFICATION
	}

	public async getReactions(
		query: IQueryReaction,
		sort: Record<string, 1 | -1>
	): Promise<[IReactionDocument[], number]> {
		const reactions: IReactionDocument[] = await ReactionModel.aggregate([
			{ $match: query },
			{ $sort: sort }
		]);

		return reactions.length ? [reactions, reactions.length] : [[], 0];
	}

	public async getSinglePostReactionByUsername(
		postId: string,
		username: string
	): Promise<[IReactionDocument, number] | []> {
		const reactions: IReactionDocument[] = await ReactionModel.aggregate([
			{
				$match: {
					post_Id: new mongoose.Types.ObjectId(postId),
					username: Helpers.firstLetterUppercase(username)
				}
			}
		]);

		return reactions.length ? [reactions[0], 1] : [];
	}

	public async getReactionByUsername(username: string): Promise<IReactionDocument[]> {
		const reactions: IReactionDocument[] = await ReactionModel.aggregate([
			{
				$match: {
					username: Helpers.firstLetterUppercase(username)
				}
			}
		]);

		return reactions;
	}

	public async removeReactionDataFromDB(reactionData: IReactionJob): Promise<void> {
		const { postId, username, previousReaction } = reactionData;

		await Promise.all([
			// Finds the first document that matches filter and Delete
			ReactionModel.deleteOne({ postId, type: previousReaction, username }),

			// DECREMENT PREVIOUS REACTION TO 0
			PostModel.updateOne(
				{ _id: postId },
				{
					$inc: {
						[`reactions.${previousReaction}`]: -1
					}
				},
				{ new: true }
			)
		]);

		// SEND REACTION NOTIFICATION
	}
}

export const reactionService: ReactionService = new ReactionService();
