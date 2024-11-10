import { authMiddleware } from '@global/helpers/auth-Middleware';
import { Images } from '@images/controllers/image';
import express, { Router } from 'express';

class ImageRoutes {
	private router: Router;

	constructor() {
		this.router = express.Router();
	}

	public routes(): Router {
		this.router.get(
			'/images/:userId',
			authMiddleware.checkAuthentication,
			Images.prototype.getImages
		);

		this.router.post(
			'/images/profile',
			authMiddleware.checkAuthentication,
			Images.prototype.addProfileImage
		);

		this.router.post(
			'/images/background',
			authMiddleware.checkAuthentication,
			Images.prototype.addBackgroundImage
		);

		this.router.delete(
			'/images/:imageId',
			authMiddleware.checkAuthentication,
			Images.prototype.deleteImage
		);

		this.router.delete(
			'/images/background/:bgImageId',
			authMiddleware.checkAuthentication,
			Images.prototype.deleteBackgroundImage
		);

		return this.router;
	}
}

export const imageRoutes: ImageRoutes = new ImageRoutes();
