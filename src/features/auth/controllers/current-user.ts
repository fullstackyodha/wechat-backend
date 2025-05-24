import { userService } from '@service/db/user.service';
import { UserCache } from '@service/redis/user.cache';
import { IUserDocument } from '@user/interfaces/user.interface';
import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';

const userCache: UserCache = new UserCache();

export class CurrentUser {
	public async read(req: Request, res: Response): Promise<void> {
		let isUser = false,
			token = null,
			user = null;

		// GET THE CURRENT USER FROM CACHE
		const cachedUser: IUserDocument = (await userCache.getUserFromCache(
			`${req.currentUser!.userId}`
		)) as IUserDocument;

		// CHECK IF PRESENT IN CACHE ELSE GET IT FROM MONGODB
		const exisitingUser: IUserDocument = cachedUser
			? cachedUser
			: await userService.getUserById(`${req.currentUser!.userId}`);

		// If user exists
		if (Object.keys(exisitingUser).length) {
			isUser = true;
			token = req.session?.jwt;
			user = exisitingUser;
		}

		res.status(HTTP_STATUS.OK).json({ isUser, user, token });
	}
}
