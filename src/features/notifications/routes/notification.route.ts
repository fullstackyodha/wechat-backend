import { authMiddleware } from '@global/helpers/auth-Middleware';
import { Notifications } from '@notifications/controllers/notifications';
import express, { Router } from 'express';

class NotificationRoute {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.get(
			'/notifications',
			authMiddleware.checkAuthentication,
			Notifications.prototype.getNotifications
		);

		this.router.put(
			'/notification/:notificationId',
			authMiddleware.checkAuthentication,
			Notifications.prototype.updateNotifications
		);

		this.router.delete(
			'/notification/:notificationId',
			authMiddleware.checkAuthentication,
			Notifications.prototype.deleteNotifications
		);

		return this.router;
	}
}

export const notificationRoutes: NotificationRoute = new NotificationRoute();
