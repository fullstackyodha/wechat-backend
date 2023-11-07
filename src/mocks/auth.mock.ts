import { Response } from 'express';

import { AuthPayload, IAuthDocument } from '@auth/interfaces/auth.interface';

export interface IAuthMock {
	_id?: string;
	username?: string;
	email?: string;
	uId?: string;
	password?: string;
	avatarColor?: string;
	avatarImage?: string;
	createdAt?: Date | string;
	currentPassword?: string;
	newPassword?: string;
	confirmPassword?: string;
	quote?: string;
	work?: string;
	school?: string;
	location?: string;
	facebook?: string;
	instagram?: string;
	twitter?: string;
	youtube?: string;
	messages?: boolean;
	reactions?: boolean;
	comments?: boolean;
	follows?: boolean;
}

export interface IJWT {
	jwt?: string;
}

// REQUEST HAS BODY, SESSION, PARAMS AND CURRENT USER
export const authMockRequest = (
	sessionData: IJWT,
	body: IAuthMock,
	currentUser?: AuthPayload | null,
	params?: any
) => ({ session: sessionData, body, params, currentUser });

// SENT RESPONSE CONTAINS STATUS AND JSON DATA
export const authMockResponse = (): Response => {
	const res: Response = {} as Response;
	// Accepts a value that will be returned whenever the mock function is called.
	res.status = jest.fn().mockReturnValue(res);
	res.json = jest.fn().mockReturnValue(res);

	return res;
};

export const authUserPayload: AuthPayload = {
	userId: '64f75f18d53587fec508149d',
	uId: '883315551300',
	username: 'Harshal',
	email: 'harshal31@gmail.com',
	avatarColor: 'blue',
	iat: 12345
};

export const authMock = {
	_id: '64f75f18d53587fec508149c',
	uId: '883315551300',
	username: 'Harshal',
	email: 'harshal31@gmail.com',
	avatarColor: 'blue',
	createdAt: '2023-09-05T17:02:16.605+00:00',
	save: () => {},
	comparePassword: () => false
} as unknown as IAuthDocument;
