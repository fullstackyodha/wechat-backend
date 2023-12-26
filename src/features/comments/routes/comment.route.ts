import { Add } from '@comments/controllers/add_comment';
import { Get } from '@comments/controllers/get_comments';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import express, { Router } from 'express';

class CommentRoute {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.post(
			'/post/comment',
			authMiddleware.checkAuthentication,
			Add.prototype.comment
		);

		this.router.get(
			'/post/comments/:postId',
			authMiddleware.checkAuthentication,
			Get.prototype.comments
		);

		this.router.get(
			'/post/single/comments/:postId/:commentId',
			authMiddleware.checkAuthentication,
			Get.prototype.singleComment
		);

		this.router.get(
			'/post/commentsnames/:postId',
			authMiddleware.checkAuthentication,
			Get.prototype.commentsNameFromCache
		);

		return this.router;
	}
}

export const commentRoutes: CommentRoute = new CommentRoute();
