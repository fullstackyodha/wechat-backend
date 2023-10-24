import { Document } from 'mongoose';
import { ObjectId } from 'mongodb';
import { IUserDocument } from '@user/interfaces/user.interface';

// Adds the currentUser property to request interface
declare global {
	//	Express Framework
	namespace Express {
		// req.body, req.param, req.query & req.currentUser
		interface Request {
			// Optional. if user is not logged in then it will throw error
			currentUser?: AuthPayload; // req.body, req.params, req.currentUser
		}
	}
}

export interface AuthPayload {
	userId: string;
	uId: string;
	email: string;
	username: string;
	avatarColor: string;
	iat?: number;
}

export interface IAuthDocument extends Document {
	_id: string | ObjectId;
	uId: string;
	username: string;
	email: string;
	password?: string;
	avatarColor: string;
	createdAt: Date;
	passwordResetToken?: string;
	passwordResetExpires?: number | string;
	comparePassword(password: string): Promise<boolean>;
	hashPassword(password: string): Promise<string>;
}

export interface ISignUpData {
	_id: ObjectId;
	uId: string;
	email: string;
	username: string;
	password: string;
	avatarColor: string;
}

export interface IAuthJob {
	value?: string | IAuthDocument | IUserDocument;
}
