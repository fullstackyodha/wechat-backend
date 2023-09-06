import { Request, Response, NextFunction } from 'express';
import JWT from 'jsonwebtoken';
import { config } from '@root/config';
import { NotAuthorizedError } from './error_handler';
import { AuthPayload } from '@auth/interfaces/auth.interface';

export class AuthMiddleware {
	public verifyUser(req: Request, res: Response, next: NextFunction): void {
		if (!req.session!.jwt) {
			throw new NotAuthorizedError('Please login, Token has expired!!!');
		}

		try {
			// VERIFIES THE TOKEN WITH SECRET TOKEN AND RETURNS THE PAYLOAD
			const payload: AuthPayload = JWT.verify(
				req.session!.jwt,
				config.JWT_TOKEN!
			) as AuthPayload;

			// SET CURRENT USER AS PAYLOAD DATA FROM THE JWT TOKEN
			req.currentUser = payload;
		} catch (error) {
			throw new NotAuthorizedError('Please login, Token has expired!!!');
		}

		next();
	}

	public checkAuthentication(req: Request, res: Response, next: NextFunction): void {
		if (!req.currentUser) {
			throw new NotAuthorizedError(
				'Authentication is required to access this route!!!'
			);
		}

		next();
	}
}

export const authMiddleware: AuthMiddleware = new AuthMiddleware();
