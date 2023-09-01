import HTTP_STATUS from 'http-status-codes';

export interface IError {
	message: string;
	statusCode: number;
	status: string;
}

export interface IErrorResponse {
	message: string;
	statusCode: number;
	status: string;
	serializeError(): IError;
}

// BASE CLASS
export abstract class CustomError extends Error {
	abstract statusCode: number;
	abstract status: string;

	constructor(message: string) {
		super(message);
	}

	serializeError(): IError {
		return {
			message: this.message,
			statusCode: this.statusCode,
			status: this.status
		};
	}
}

// CHILD CLASS
export class BadRequestError extends CustomError {
	statusCode: number = HTTP_STATUS.BAD_REQUEST;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}

export class NotFoundError extends CustomError {
	statusCode: number = HTTP_STATUS.NOT_FOUND;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}

export class NotAuthorizedError extends CustomError {
	statusCode: number = HTTP_STATUS.UNAUTHORIZED;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}

export class FileTooLargeError extends CustomError {
	statusCode: number = HTTP_STATUS.REQUEST_TOO_LONG;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}

export class ServerError extends CustomError {
	statusCode: number = HTTP_STATUS.SERVICE_UNAVAILABLE;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}

export class JoiRequestValidationError extends CustomError {
	statusCode: number = HTTP_STATUS.BAD_REQUEST;
	status: string = 'error';

	constructor(message: string) {
		// CALLS TO THE SUPER CLASS CONSTRUCTOR
		super(message);
	}
}
