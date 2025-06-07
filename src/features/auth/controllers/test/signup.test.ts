import { Request, Response } from 'express';
import * as cloudinaryUploads from '@global/helpers/cloudinaryUpload';
import { authMock, authMockRequest, authMockResponse } from '@root/mocks/auth.mock';
import { CustomError } from '@global/helpers/error_handler';
import { SignUp } from '@root/features/auth/controllers/signup';
import { authService } from '@service/db/auth.service';
import { UserCache } from '@service/redis/user.cache';

// Instructs Jest to use fake versions of the standard timer functions.
jest.useFakeTimers();

// Paths to the methods that we want to mock
jest.mock('@service/queues/base.queue');
jest.mock('@service/queues/user.queue');
jest.mock('@service/queues/auth.queue');
jest.mock('@service/redis/user.cache');
jest.mock('@global/helpers/cloudinaryUpload');

describe('SignUp', () => {
	beforeEach(() => {
		// Resets the state of all mocks
		jest.resetAllMocks();
	});

	afterEach(() => {
		// Clears the mock.calls and mock.instances properties of all mocks.
		jest.clearAllMocks();
		jest.clearAllTimers();
	});

	it('Should throw an error if username is not available', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: '',
				email: 'manny@me.com',
				password: 'qwerty',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Username is a required field');
		});
	});

	it('Should throw an error if username length is less than minimum length', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'as',
				email: 'manny@me.com',
				password: 'qwerty',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Invalid username');
		});
	});

	it('Should throw an error if username length is more than maximum length', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'asbfdghfghgfsd',
				email: 'manny@me.com',
				password: 'qwerty',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Invalid username');
		});
	});

	it('Should throw an error if valid email not provided', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'harry',
				email: 'mannymecom',
				password: 'qwerty',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toBe('Email must be valid');
		});
	});

	it('Should throw an error if email not provided', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'harry',
				email: '',
				password: 'qwerty',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Email is a required field');
		});
	});

	it('Should throw an error if password not provided', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'harry',
				email: 'harshal@gmail.com',
				password: '',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Password is a required field');
		});
	});

	it('Should throw an error if password length is less than minimum length', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'harry',
				email: 'harshal@gmail.com',
				password: '45',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Invalid password');
		});
	});

	it('Should throw an error if password length is more than maximum length', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'harry',
				email: 'harshal@gmail.com',
				password: '45fdsagsdfgvasd',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Invalid password');
		});
	});

	it('Should throw Unauthorised error is user already exist', () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'Harshal',
				email: 'harshal3196@gmail.com',
				password: 'Qwerty31',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		// Creates a mock function similar to jest.fn but also tracks calls to object[methodName]
		jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(authMock);

		SignUp.prototype.create(req, res).catch((error: CustomError) => {
			// console.log(error)
			expect(error.statusCode).toEqual(400);
			expect(error.serializeError().message).toEqual('Invalid Credentials');
		});
	});

	it('Should set session data for valid credential and send json response', async () => {
		const req: Request = authMockRequest(
			{},
			{
				username: 'Harshal',
				email: 'harshal3196@gmail.com',
				password: 'Qwerty31',
				avatarColor: 'red',
				avatarImage: 'data:text/plain;base64,SVFHSDUOUJHFS=='
			}
		) as Request;

		const res: Response = authMockResponse() as Response;

		// Creates a mock function similar to jest.fn but also tracks calls to object[methodName]
		jest.spyOn(authService, 'getUserByUsernameOrEmail').mockResolvedValue(null as any);

		const userSpy = jest.spyOn(UserCache.prototype, 'saveUserToCache');

		jest
			.spyOn(cloudinaryUploads, 'uploads')
			.mockImplementation((): any =>
				Promise.resolve({ version: '112324235', public_id: '1234567' })
			);

		await SignUp.prototype.create(req, res);

		// Ensure that a variable is not undefined.
		expect(req.session?.jwt).toBeDefined();
		expect(res.json).toHaveBeenCalledWith({
			message: 'User created Successfully!!!',
			data: { newUser: userSpy.mock.calls[0][2], token: req.session?.jwt }
		});
	});
});
