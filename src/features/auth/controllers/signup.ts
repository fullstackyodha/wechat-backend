import { ObjectId } from 'mongodb';
import { Request, Response } from 'express';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { IAuthDocument, ISignUpData } from '@auth/interfaces/auth.interface';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error_handler';
import { Helpers } from '@global/helpers/helpers';
import HTTP_STATUS from 'http-status-codes';
import { UploadApiResponse } from 'cloudinary';
import { uploads } from '@global/helpers/cloudinaryUpload';
import { IUserDocument } from '@user/interfaces/user.interface';
import { UserCache } from '@service/redis/user.cache';
import { config } from '@root/config';
import { omit } from 'lodash';
import { authQueue } from '@service/queues/auth.queue';
import { userQueue } from '@service/queues/user.queue';
import JWT from 'jsonwebtoken';
import { signupSchema } from '@auth/schemes/signup';

// CREATING USER CACHE
const userCache: UserCache = new UserCache();

export class SignUp {
	@joiValidation(signupSchema)
	public async create(req: Request, res: Response): Promise<void> {
		const { username, email, password, avatarColor, avatarImage } = req.body;

		// check if user with email or username already exists or not
		const checkIfUserExists: IAuthDocument = await authService.getUserByUsernameOrEmail(
			username,
			email
		);

		if (checkIfUserExists) {
			throw new BadRequestError('Invalid Credentials');
		}

		// AuthId for user which is created by Mongodb
		const authObjectId: ObjectId = new ObjectId();

		// Generating custom user id
		const uId = `${Helpers.generateRandomId(12)}`;

		// AUTH DATA WHILE SIGNUP
		const authData: IAuthDocument = SignUp.prototype.signupData({
			_id: authObjectId,
			uId,
			username,
			email,
			password,
			avatarColor
		}) as IAuthDocument;

		// UserId for user which is created by Mongodb
		const userObjectId: ObjectId = new ObjectId();

		// UPLOAD AVATAR IMAGE TO CLOUDINARY
		const result: UploadApiResponse = (await uploads(
			avatarImage,
			`${userObjectId}`, //https://res.cloudinary.com/123/${userObjectId}
			true,
			true
		)) as UploadApiResponse;

		// console.log('RESULT', result); //{public_id, version, api_key, url, secure_url}

		if (!result?.public_id) {
			throw new BadRequestError('File upload: Error occured. Try again!!!');
		}

		// ADD TO REDIS CACHE
		const userDataForCache: IUserDocument = SignUp.prototype.userData(
			authData,
			userObjectId
		);

		userDataForCache.profilePicture = `https://res.cloudinary.com/${config.CLOUD_NAME}/image/upload/v${result.version}/${userObjectId}`;

		// SAVE NEW USER DATA TO THE CACHE
		await userCache.saveUserToCache(`${userObjectId}`, uId, userDataForCache);

		// Omit data before Adding to DATABASE
		omit(userDataForCache, ['uId', 'username', 'email', 'password', 'avatarColor']);

		// ADD DATA TO THE AUTH QUEUE
		authQueue.addAuthUserJob('addAuthUserToDB', { value: authData });

		// ADD DATA TO THE USER QUEUE
		userQueue.addUserJob('addUserToDB', { value: userDataForCache });

		// Assign JWT TOKEN TO USER
		const userJwtToken: string = SignUp.prototype.signToken(authData, userObjectId);

		// STORING JWT TOKEN OF THE USER IN SESSION COOKIE
		req.session = { jwt: userJwtToken };

		res.status(HTTP_STATUS.CREATED).json({
			message: 'User created Successfully!!!',
			data: { newUser: userDataForCache, token: userJwtToken }
		});
	}

	// ASSIGNING JWT TOKEN BASED ON USERID AND AUTH DATA
	private signToken(data: IAuthDocument, userObjectId: ObjectId): string {
		const { uId, username, email, avatarColor } = data;

		// Synchronously sign the given payload into a JSON Web Token string payload
		return JWT.sign(
			{ userId: userObjectId, uId, username, email, avatarColor },
			config.JWT_TOKEN!
		);
	}

	// SIGNUP DATA FORMAT
	private signupData(data: ISignUpData): IAuthDocument {
		const { _id, uId, username, email, password, avatarColor } = data;

		return {
			_id,
			uId,
			username: Helpers.firstLetterUppercase(username),
			email: Helpers.lowerCase(email),
			password,
			avatarColor,
			createdAt: new Date()
		} as unknown as IAuthDocument;
	}

	// USER DATA FORMAT
	private userData(data: IAuthDocument, userObjectId: ObjectId): IUserDocument {
		const { _id: authId, username, email, uId, password, avatarColor } = data;

		return {
			_id: userObjectId,
			authId,
			username: Helpers.firstLetterUppercase(username),
			email,
			uId,
			password,
			avatarColor,
			profilePicture: '',
			postsCount: 0,
			followersCount: 0,
			followingCount: 0,
			blocked: [],
			blockedBy: [],
			notifications: {
				messages: true,
				reactions: true,
				comments: true,
				follows: true
			},
			social: {
				facebook: '',
				instagram: '',
				twitter: '',
				youtube: ''
			},
			work: '',
			school: '',
			location: '',
			quote: '',
			bgImageVersion: '',
			bgImageId: ''
		} as unknown as IUserDocument;
	}
}
