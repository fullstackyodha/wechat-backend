import { CurrentUser } from '@auth/controllers/current-user';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import express, { Router } from 'express';

class CurrentUserRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.get(
			'/currentUser',
			// Check authentication before accessing current user data
			authMiddleware.checkAuthentication,
			CurrentUser.prototype.read
		);

		return this.router;
	}
}

export const currentUserRoutes: CurrentUserRoutes = new CurrentUserRoutes();
