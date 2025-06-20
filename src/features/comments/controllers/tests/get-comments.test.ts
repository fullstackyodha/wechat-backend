import mongoose from 'mongoose';
import { Request, Response } from 'express';

import { authUserPayload } from '@root/mocks/auth.mock';
import {
	commentNames,
	commentsData,
	reactionMockRequest,
	reactionMockResponse
} from '@root/mocks/reactions.mock';
import { CommentCache } from '@service/redis/comment.cache';
import { Get } from '@comments/controllers/get_comments';
import { commentService } from '@service/db/comment.service';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/comment.cache');

describe('Get', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	describe('Comments', () => {
		it('should send correct json response if comments exist in cache', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: '6579471db5b157e445fa9222'
			}) as Request;

			const res: Response = reactionMockResponse();

			jest
				.spyOn(CommentCache.prototype, 'getPostCommentsFromCache')
				.mockResolvedValue([commentsData]);

			await Get.prototype.comments(req, res);

			expect(CommentCache.prototype.getPostCommentsFromCache).toHaveBeenCalledWith(
				'6579471db5b157e445fa9222'
			);

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Post comments',
				comments: [commentsData]
			});
		});

		it('should send correct json response if comments exist in database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(CommentCache.prototype, 'getPostCommentsFromCache')
				.mockResolvedValue([]);
			jest
				.spyOn(commentService, 'getPostCommentsFromDB')
				.mockResolvedValue([commentsData]);

			await Get.prototype.comments(req, res);
			expect(commentService.getPostCommentsFromDB).toHaveBeenCalledWith(
				{ postId: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268') },
				{ createdAt: -1 }
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Post comments',
				comments: [commentsData]
			});
		});
	});

	describe('commentsNamesFromCache', () => {
		it('should send correct json response if data exist in redis', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;

			const res: Response = reactionMockResponse();

			jest
				.spyOn(CommentCache.prototype, 'getCommentNamesFromCache')
				.mockResolvedValue([commentNames]);

			await Get.prototype.commentsNameFromCache(req, res);

			expect(CommentCache.prototype.getCommentNamesFromCache).toHaveBeenCalledWith(
				'6027f77087c9d9ccb1555268'
			);
			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Post comments names',
				comments: commentNames
			});
		});

		it('should send correct json response if data exist in database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;

			const res: Response = reactionMockResponse();

			jest
				.spyOn(CommentCache.prototype, 'getCommentNamesFromCache')
				.mockResolvedValue([]);

			jest
				.spyOn(commentService, 'getPostCommentNamesFromDB')
				.mockResolvedValue([commentNames]);

			await Get.prototype.commentsNameFromCache(req, res);

			expect(commentService.getPostCommentNamesFromDB).toHaveBeenCalledWith(
				{ postId: new mongoose.Types.ObjectId('6027f77087c9d9ccb1555268') },
				{ createdAt: -1 }
			);

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Post comments names',
				comments: commentNames
			});
		});

		it('should return empty comments if data does not exist in redis and database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;

			const res: Response = reactionMockResponse();

			jest
				.spyOn(CommentCache.prototype, 'getCommentNamesFromCache')
				.mockResolvedValue([]);

			jest.spyOn(commentService, 'getPostCommentNamesFromDB').mockResolvedValue([]);

			await Get.prototype.commentsNameFromCache(req, res);

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Post comments names',
				comments: []
			});
		});
	});

	describe('singleComment', () => {
		it('should send correct json response from cache', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				commentId: '6064861bc25eaa5a5d2f9bf4',
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(CommentCache.prototype, 'getSingleCommentFromCache')
				.mockResolvedValue([commentsData]);

			await Get.prototype.singleComment(req, res);
			expect(CommentCache.prototype.getSingleCommentFromCache).toHaveBeenCalledWith(
				'6027f77087c9d9ccb1555268',
				'6064861bc25eaa5a5d2f9bf4'
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Single comment',
				comments: commentsData
			});
		});

		it('should send correct json response from database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				commentId: '6064861bc25eaa5a5d2f9bf4',
				postId: '6027f77087c9d9ccb1555268'
			}) as Request;

			const res: Response = reactionMockResponse();

			jest
				.spyOn(CommentCache.prototype, 'getSingleCommentFromCache')
				.mockResolvedValue([]);

			jest
				.spyOn(commentService, 'getPostCommentsFromDB')
				.mockResolvedValue([commentsData]);

			await Get.prototype.singleComment(req, res);
			expect(commentService.getPostCommentsFromDB).toHaveBeenCalledWith(
				{ _id: new mongoose.Types.ObjectId('6064861bc25eaa5a5d2f9bf4') },
				{ createdAt: -1 }
			);

			expect(res.status).toHaveBeenCalledWith(200);

			expect(res.json).toHaveBeenCalledWith({
				message: 'Single comment',
				comments: commentsData
			});
		});
	});
});
