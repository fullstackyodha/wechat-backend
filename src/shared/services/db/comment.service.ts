import {
	ICommentDocument,
	ICommentJob,
	ICommentNameList,
	IQueryComment
} from '@comments/interfaces/comment.interface';
import { CommentsModel } from '@comments/models/comment.schema';
import {
	INotificationDocument,
	INotificationTemplate
} from '@notifications/interfaces/notification.interface';
import { NotificationModel } from '@notifications/models/notification.scehma';
import { IPostDocument } from '@post/interfaces/post.interface';
import { PostModel } from '@post/models/post.schema';
import { notificationTemplate } from '@service/email/templates/notifications/notification.template';
import { emailQueue } from '@service/queues/email.queue';
import { UserCache } from '@service/redis/user.cache';
import { socketIONotificationObject } from '@socket/notifications';
import { IUserDocument } from '@user/interfaces/user.interface';
import mongoose, { Query } from 'mongoose';

const userCache: UserCache = new UserCache();

class CommentService {
	// ADD POST COMMENT TO DATABASE
	public async addPostCommentToDB(commentData: ICommentJob): Promise<void> {
		const { postId, userTo, userFrom, username, comment } = commentData;

		const comments: Promise<ICommentDocument> = CommentsModel.create(comment);

		// INCREMENT THE COMMENT COUNT BY 1 OF THE POST
		const post: Query<IPostDocument, IPostDocument> = PostModel.findOneAndUpdate(
			{ _id: postId },
			{ $inc: { commentsCount: 1 } },
			{ new: true } // RETURN THE UPDATED DATA
		) as Query<IPostDocument, IPostDocument>;

		// GET USER DATA FROM THE CACHE
		const user: Promise<IUserDocument> = userCache.getUserFromCache(
			userTo
		) as Promise<IUserDocument>;

		// ORDER MATTERS
		const response: [ICommentDocument, IPostDocument, IUserDocument] =
			await Promise.all([comments, post, user]);

		// SEND COMMENT NOTIFICATION
		if (response[2].notifications.comments && userFrom !== userTo) {
			const notificationModel: INotificationDocument = new NotificationModel();

			const notifications = await notificationModel.insertNotification({
				userTo,
				userFrom,
				message: `${username} commented on your post`,
				notificationType: 'comment',
				entityId: new mongoose.Types.ObjectId(postId),
				createdItemId: new mongoose.Types.ObjectId(response[0]._id),
				createdAt: new Date(),
				comment: comment.comment,
				post: response[1].post,
				imgId: response[1].imgId!,
				imgVersion: response[1].imgVersion!,
				gifUrl: response[1].gifUrl!,
				read: false,
				reaction: ''
			});

			// SEND TO CLIENT USING SOCKET IO
			socketIONotificationObject.emit('insert notification', notifications, {
				userTo
			});

			// SEND TO EMAIL QUEUE
			const templateParams: INotificationTemplate = {
				username: response[2].username!,
				message: `${username} commented on your post`,
				header: 'New Comment Notification'
			};

			const template: string =
				notificationTemplate.notificationMessageTemplate(templateParams);

			emailQueue.addEmailJob('commentEmail', {
				receiverEmail: response[2].email!,
				template,
				subject: 'Post Notification'
			});
		}
	}

	// GET POST COMMENT FROM DATABASE
	public async getPostCommentsFromDB(
		query: IQueryComment,
		sort: Record<string, 1 | -1>
	): Promise<ICommentDocument[]> {
		const comments: ICommentDocument[] = await CommentsModel.aggregate([
			{ $match: query },
			{ $sort: sort }
		]);

		return comments;
	}

	// GET POST COMMENT NAMES FROM DATABASE
	public async getPostCommentNamesFromDB(
		query: IQueryComment,
		sort: Record<string, 1 | -1>
	): Promise<ICommentNameList[]> {
		const commentNamesList: ICommentNameList[] = (await CommentsModel.aggregate([
			{ $match: query },
			{ $sort: sort },
			// Add the username in the names list and keep the sum count
			{ $group: { _id: null, names: { $addToSet: '$username' }, count: { $sum: 1 } } },
			// EXCLUDE _id
			{ $project: { _id: 0 } }
		])) as ICommentNameList[];

		return commentNamesList;
	}
}

export const commentService: CommentService = new CommentService();
