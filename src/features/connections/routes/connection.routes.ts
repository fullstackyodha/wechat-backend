import { Connection } from '@connections/controllers/connections';
import { Add } from '@connections/controllers/follower.user';
import { Remove } from '@connections/controllers/unFollow.user';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import express, { Router } from 'express';

class ConnectionRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.put(
			'/user/follower/:followerId',
			authMiddleware.checkAuthentication,
			Add.prototype.follower
		);

		this.router.put(
			'/user/unfollower/:followeeId/:followerId',
			authMiddleware.checkAuthentication,
			Remove.prototype.follower
		);

		this.router.get(
			'/user/followings',
			authMiddleware.checkAuthentication,
			Connection.prototype.getUserFollowings
		);

		this.router.get(
			'/user/followers/:userId',
			authMiddleware.checkAuthentication,
			Connection.prototype.getUserFollowers
		);

		this.router.get(
			'/user/block/:followerId',
			authMiddleware.checkAuthentication,
			Connection.prototype.blockUser
		);

		this.router.get(
			'/user/unblock/:followerId',
			authMiddleware.checkAuthentication,
			Connection.prototype.unBlockUser
		);

		return this.router;
	}
}

export const connectionRoutes: ConnectionRoutes = new ConnectionRoutes();
