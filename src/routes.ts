import { authRoutes } from '@auth/routes/authsRoute';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { chatRoutes } from '@chats/routes/chat.routes';
import { commentRoutes } from '@comments/routes/comment.route';
import { connectionRoutes } from '@connections/routes/connection.routes';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import { imageRoutes } from '@images/routes/image.routes';
import { notificationRoutes } from '@notifications/routes/notification.route';
import { postRoutes } from '@post/routes/postRoute';
import { reactionRoutes } from '@reaction/routes/reactionRoute';
import { serverAdapter } from '@service/queues/base.queue';
import { healthRoutes } from '@user/routes/healthRoutes';
import { userRoutes } from '@user/routes/user.routes';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
	const routes = () => {
		app.use('/queues', serverAdapter.getRouter());

		app.use('', healthRoutes.health());
		app.use('', healthRoutes.env());
		app.use('', healthRoutes.instance());
		app.use('', healthRoutes.fiboRoutes());

		app.use(BASE_PATH, authRoutes.routes());

		app.use(BASE_PATH, authRoutes.signOutRoute());

		// Verify whether user is logged in or not
		app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, connectionRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, notificationRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, imageRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, chatRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, userRoutes.routes());
	};

	routes();
};
