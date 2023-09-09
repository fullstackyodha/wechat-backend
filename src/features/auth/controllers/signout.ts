import HTTP_STATUS from 'http-status-codes';
import { Request, Response } from 'express';

export class SignOut {
	public async update(req: Request, res: Response): Promise<Response> {
		console.log(req.session);

		// Remove user from the cookie session
		req.session = null;

		return res.status(HTTP_STATUS.OK).json({
			message: 'User Logged Out Successfully!!!',
			user: {},
			token: {}
		});
	}
}
