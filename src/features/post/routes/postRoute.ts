import express, { Router } from 'express';

import { authMiddleware } from '@global/helpers/auth-Middleware';
import { Create } from '@post/controllers/create_post';
import { Get } from '@post/controllers/get_posts';
import { Delete } from '@post/controllers/delete_post';
import { Update } from '@post/controllers/update_post';

class PostRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.get(
			'/post/all/:page',
			authMiddleware.checkAuthentication,
			Get.prototype.posts
		);

		this.router.get(
			'/post/image/:page',
			authMiddleware.checkAuthentication,
			Get.prototype.postsWithImages
		);

		this.router.post(
			'/post',
			authMiddleware.checkAuthentication,
			Create.prototype.post
		);

		this.router.post(
			'/post/image/post',
			authMiddleware.checkAuthentication,
			Create.prototype.postWithImage
		);

		this.router.put(
			'/post/:postId',
			authMiddleware.checkAuthentication,
			Update.prototype.post
		);

		this.router.put(
			'/post/image/:postId',
			authMiddleware.checkAuthentication,
			Update.prototype.postWithImage
		);

		this.router.delete(
			'/post/:postId',
			authMiddleware.checkAuthentication,
			Delete.prototype.post
		);

		return this.router;
	}
}

export const postRoutes: PostRoutes = new PostRoutes();
