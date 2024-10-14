import { Add } from '@connections/controllers/follower.user';
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

		return this.router;
	}
}

export const connectionRoutes: ConnectionRoutes = new ConnectionRoutes();
