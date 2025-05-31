import { Request, Response } from 'express';
import { authUserPayload } from '@root/mocks/auth.mock';
import {
	reactionMockRequest,
	reactionMockResponse,
	reactionData
} from '@root/mocks/reactions.mock';
import { reactionService } from '@service/db/reaction.service';
import { ReactionCache } from '@service/redis/reaction.cache';
import { Get } from '@reaction/controllers/get_reactions';
import { postMockData } from '@root/mocks/post.mock';
import mongoose from 'mongoose';

jest.useFakeTimers();
jest.mock('@service/queues/base.queue');
jest.mock('@service/redis/reaction.cache');

describe('Get', () => {
	beforeEach(() => {
		jest.restoreAllMocks();
	});

	afterEach(() => {
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	describe('reactions', () => {
		it('should send correct json response if reactions exist in cache', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getReactionFromCache')
				.mockResolvedValue([[reactionData], 1]);

			await Get.prototype.reaction(req, res);
			expect(ReactionCache.prototype.getReactionFromCache).toHaveBeenCalledWith(
				`${postMockData._id}`
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Post reactions',
				reactions: [reactionData],
				count: 1
			});
		});

		it('should send correct json response if reactions exist in database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getReactionFromCache')
				.mockResolvedValue([[], 0]);
			jest
				.spyOn(reactionService, 'getReactions')
				.mockResolvedValue([[reactionData], 1]);

			await Get.prototype.reaction(req, res);
			expect(reactionService.getReactions).toHaveBeenCalledWith(
				{ postId: new mongoose.Types.ObjectId(`${postMockData._id}`) },
				{ createdAt: -1 }
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Post reactions',
				reactions: [reactionData],
				count: 1
			});
		});

		it('should send correct json response if reactions list is empty', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getReactionFromCache')
				.mockResolvedValue([[], 0]);
			jest.spyOn(reactionService, 'getReactions').mockResolvedValue([[], 0]);

			await Get.prototype.reaction(req, res);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Post reactions',
				reactions: [],
				count: 0
			});
		});
	});

	describe('singleReactionByUsername', () => {
		it('should send correct json response if reactions exist in cache', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`,
				username: postMockData.username
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getSingleReactionByUsernameFromCache')
				.mockResolvedValue([reactionData, 1]);

			await Get.prototype.singleReactionByUsername(req, res);
			expect(
				ReactionCache.prototype.getSingleReactionByUsernameFromCache
			).toHaveBeenCalledWith(`${postMockData._id}`, postMockData.username);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Single post reaction by username',
				reactions: reactionData,
				count: 1
			});
		});

		it('should send correct json response if reactions exist in database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`,
				username: postMockData.username
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getSingleReactionByUsernameFromCache')
				.mockResolvedValue([]);
			jest
				.spyOn(reactionService, 'getSinglePostReactionByUsername')
				.mockResolvedValue([reactionData, 1]);

			await Get.prototype.singleReactionByUsername(req, res);
			expect(reactionService.getSinglePostReactionByUsername).toHaveBeenCalledWith(
				`${postMockData._id}`,
				postMockData.username
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Single post reaction by username',
				reactions: reactionData,
				count: 1
			});
		});

		it('should send correct json response if reactions list is empty', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				postId: `${postMockData._id}`,
				username: postMockData.username
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(ReactionCache.prototype, 'getSingleReactionByUsernameFromCache')
				.mockResolvedValue([]);
			jest
				.spyOn(reactionService, 'getSinglePostReactionByUsername')
				.mockResolvedValue([]);

			await Get.prototype.singleReactionByUsername(req, res);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'Single post reaction by username',
				reactions: {},
				count: 0
			});
		});
	});

	describe('reactionsByUsername', () => {
		it('should send correct json response if reactions exist in database', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				username: postMockData.username
			}) as Request;
			const res: Response = reactionMockResponse();
			jest
				.spyOn(reactionService, 'getReactionByUsername')
				.mockResolvedValue([reactionData]);

			await Get.prototype.reactionByUsername(req, res);
			expect(reactionService.getReactionByUsername).toHaveBeenCalledWith(
				postMockData.username
			);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'All user reactions by username',
				reactions: [reactionData]
			});
		});

		it('should send correct json response if reactions list is empty', async () => {
			const req: Request = reactionMockRequest({}, {}, authUserPayload, {
				username: postMockData.username
			}) as Request;
			const res: Response = reactionMockResponse();
			jest.spyOn(reactionService, 'getReactionByUsername').mockResolvedValue([]);

			await Get.prototype.reactionByUsername(req, res);
			expect(res.status).toHaveBeenCalledWith(200);
			expect(res.json).toHaveBeenCalledWith({
				message: 'All user reactions by username',
				reactions: []
			});
		});
	});
});
