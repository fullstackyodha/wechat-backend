import express, { Router } from 'express';

import { authMiddleware } from '@global/helpers/auth-Middleware';
import { Add } from '@reaction/controllers/add_reactions';
import { Remove } from '@reaction/controllers/remove_reaction';
import { Get } from '@reaction/controllers/get_reactions';

class ReactionRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.get(
			'/post/reactions/:postId',
			authMiddleware.checkAuthentication,
			Get.prototype.reaction
		);

		this.router.get(
			'/post/single/reaction/username/:username/:postId',
			authMiddleware.checkAuthentication,
			Get.prototype.singleReactionByUsername
		);

		this.router.get(
			'/post/reactions/username/:username',
			authMiddleware.checkAuthentication,
			Get.prototype.reactionByUsername
		);

		this.router.post(
			'/post/reaction',
			authMiddleware.checkAuthentication,
			Add.prototype.reaction
		);

		this.router.delete(
			'/post/reaction/:postId/:previousReaction/:postReactions',
			authMiddleware.checkAuthentication,
			Remove.prototype.reaction
		);

		return this.router;
	}
}

export const reactionRoutes: ReactionRoutes = new ReactionRoutes();
