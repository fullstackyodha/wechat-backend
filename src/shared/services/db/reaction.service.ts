import { Helpers } from '@global/helpers/helpers';
import {
	INotificationDocument,
	INotificationTemplate
} from '@notifications/interfaces/notification.interface';
import { NotificationModel } from '@notifications/models/notification.scehma';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import {
	IQueryReaction,
	IReactionDocument,
	IReactionJob
} from '@reaction/interfaces/reaction.interface';
import { ReactionModel } from '@reaction/models/reaction.schema';
import { notificationTemplate } from '@service/email/templates/notifications/notification.template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { socketIONotificationObject } from '@socket/notifications';
import { IUserDocument } from '@user/interfaces/user.interface';
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
		const updatedReaction: [IUserDocument, IReactionDocument, IPostDocument] =
			(await Promise.all([
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
			])) as unknown as [IUserDocument, IReactionDocument, IPostDocument];

		// console.log(updatedReaction);

		// SEND REACTION NOTIFICATION
		if (updatedReaction[0]?.notifications.reactions && userTo !== userFrom) {
			const notificationModel: INotificationDocument = new NotificationModel();

			const notifications = await notificationModel.insertNotification({
				userTo: userTo as string,
				userFrom: userFrom as string,
				message: `${username} reaction to your post`,
				notificationType: 'reactions',
				entityId: new mongoose.Types.ObjectId(postId),
				createdItemId: new mongoose.Types.ObjectId(updatedReaction[1]._id),
				createdAt: new Date(),
				comment: '',
				post: updatedReaction[2].post,
				reaction: type!,
				imgId: updatedReaction[2].imgId!,
				imgVersion: updatedReaction[2].imgVersion!,
				gifUrl: updatedReaction[2].gifUrl!,
				read: false
			});

			// SEND TO CLIENT USING SOCKET IO
			socketIONotificationObject.emit('insert notification', notifications, {
				userTo
			});

			// SEND TO EMAIL QUEUE
			const templateParams: INotificationTemplate = {
				username: updatedReaction[1]?.username ?? '',
				message: `${username} reacted to your post`,
				header: 'New Reaction Notification'
			};

			const template: string =
				notificationTemplate.notificationMessageTemplate(templateParams);

			emailQueue.addEmailJob('reactionEmail', {
				receiverEmail: updatedReaction[0]?.email ?? '',
				template,
				subject: `${username} reacted to your post`
			});
		}
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
