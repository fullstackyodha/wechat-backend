import {
	IGetPostsQuery,
	IPostDocument,
	IQueryComplete,
	IQueryDeleted
} from '@post/interfaces/post.interface';
import { Query, UpdateQuery } from 'mongoose';

import { PostModel } from '@post/models/post.schema';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserModel } from '@user/models/user.schema';

class PostService {
	public async addPostToDB(userId: string, createdPost: IPostDocument): Promise<void> {
		const post: Promise<IPostDocument> = PostModel.create(createdPost);

		// updates the first document that matches filter with update.
		const user: UpdateQuery<IUserDocument> = UserModel.updateOne(
			{ _id: userId },
			{ $inc: { postsCount: 1 } }
		);

		// resolved when all of the provided Promises resolve,
		// or rejected when any Promise is rejected
		await Promise.all([post, user]);
	}

	public async getPostFromDB(
		query: IGetPostsQuery,
		skip: number = 0,
		limit: number = 0,
		sort: Record<string, 1 | -1>
	): Promise<IPostDocument[]> {
		let postQuery = {};

		if (query?.imgId && query?.gifUrl) {
			// imgId & gifUrl must not be empty
			postQuery = { $or: [{ imgId: { $ne: '' } }, { gifUrl: { $ne: '' } }] };
		} else if (query?.videoId) {
			postQuery = { $or: [{ videoId: { $ne: '' } }] };
		} else {
			postQuery = query;
		}

		const posts: IPostDocument[] = await PostModel.aggregate([
			{ $match: postQuery },
			{ $sort: sort },
			{ $skip: skip },
			{ $limit: limit }
		]);

		return posts;
	}

	public async updatePostInDB(
		postId: string,
		updatedPost: IPostDocument
	): Promise<void> {
		const savedUpdatedPost: UpdateQuery<IPostDocument> = await PostModel.updateOne(
			{ _id: postId },
			{ $set: updatedPost }
		);
	}

	public async deletePostFromDB(postId: string, userId: string): Promise<void> {
		const deletedPost: Query<IQueryComplete & IQueryDeleted, IPostDocument> =
			PostModel.deleteOne({
				_id: postId
			});

		// delete reaction here

		const decrementPostCount: UpdateQuery<IUserDocument> = UserModel.updateOne(
			{ _id: userId },
			{ $inc: { postsCount: -1 } }
		);

		await Promise.all([deletedPost, decrementPostCount]);
	}

	public async postCount(): Promise<number> {
		const count: number = await PostModel.find({}).countDocuments();
		return count;
	}
}

export const postService: PostService = new PostService();
