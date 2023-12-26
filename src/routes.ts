import { authRoutes } from '@auth/routes/authsRoute';
import { currentUserRoutes } from '@auth/routes/currentUserRoutes';
import { commentRoutes } from '@comments/routes/comment.route';
import { authMiddleware } from '@global/helpers/auth-Middleware';
import { postRoutes } from '@post/routes/postRoute';
import { reactionRoutes } from '@reaction/routes/reactionRoute';
import { serverAdapter } from '@service/queues/base.queue';
import { Application } from 'express';

const BASE_PATH = '/api/v1';

export default (app: Application) => {
	const routes = () => {
		app.use('/queues', serverAdapter.getRouter());

		app.use(BASE_PATH, authRoutes.routes());

		app.use(BASE_PATH, authRoutes.signOutRoute());

		// Verify whether user is logged in or not
		app.use(BASE_PATH, authMiddleware.verifyUser, currentUserRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, postRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, reactionRoutes.routes());

		app.use(BASE_PATH, authMiddleware.verifyUser, commentRoutes.routes());
	};

	routes();
};
