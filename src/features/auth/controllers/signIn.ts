import { config } from '@root/config';
// import Logger from 'bunyan';
import { Request, Response } from 'express';
import JWT from 'jsonwebtoken';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import HTTP_STATUS from 'http-status-codes';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error_handler';
import { loginSchema } from '@auth/schemes/signin';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { userService } from '@service/db/user.service';
import { IUserDocument } from '@user/interfaces/user.interface';

// const log: Logger = config.createLogger('signin');

export class SignIn {
	@joiValidation(loginSchema)
	public async read(req: Request, res: Response): Promise<void> {
		const { username, password } = req.body;

		// check if user with email or username already exists or not
		const exisitingUser: IAuthDocument =
			await authService.getAuthUserByUsername(username);

		if (!exisitingUser) {
			throw new BadRequestError('Invalid Credentials');
		}

		// CHECK IF PASSWORD MATCHES
		const passwordMatch: boolean = await exisitingUser.comparePassword(password);

		if (!passwordMatch) {
			throw new BadRequestError('Invalid Credentials');
		}

		// SEARCH USER BY AUTH ID/EXISTING ID
		const user: IUserDocument = await userService.getUserByAuthId(
			`${exisitingUser._id}`
		);

		// Synchronously sign the given payload into a JSON Web Token string payload
		const userJWT = JWT.sign(
			{
				// USERID PRESENT IN USER DOCUMENT
				userId: user._id,

				// PRESENT IN AUTH DOCUMENT
				uId: exisitingUser.uId,
				username: exisitingUser.username,
				email: exisitingUser.email,
				avatarColor: exisitingUser.avatarColor
			},
			config.JWT_TOKEN!
		);

		// STORING JWT TOKEN OF THE USER IN SESSION COOKIE
		req.session = { jwt: userJWT };

		const userDocument: IUserDocument = {
			...user,
			authId: exisitingUser._id!,
			uId: exisitingUser.uId,
			username: exisitingUser.username,
			email: exisitingUser.email,
			avatarColor: exisitingUser.avatarColor,
			createdAt: exisitingUser.createdAt
		} as IUserDocument;

		res.status(HTTP_STATUS.OK).json({
			message: 'User Logged In Successfully!!!',
			data: { user: userDocument, token: userJWT }
		});
	}
}
