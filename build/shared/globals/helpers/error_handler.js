"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JoiRequestValidationError = exports.ServerError = exports.FileTooLargeError = exports.NotAuthorizedError = exports.NotFoundError = exports.BadRequestError = exports.CustomError = void 0;
const http_status_codes_1 = __importDefault(require("http-status-codes"));
// BASE CLASS
class CustomError extends Error {
    constructor(message) {
        super(message);
    }
    serializeError() {
        return {
            message: this.message,
            statusCode: this.statusCode,
            status: this.status
        };
    }
}
exports.CustomError = CustomError;
// CHILD CLASS
class BadRequestError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.BAD_REQUEST;
        this.status = 'error';
    }
}
exports.BadRequestError = BadRequestError;
class NotFoundError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.NOT_FOUND;
        this.status = 'error';
    }
}
exports.NotFoundError = NotFoundError;
class NotAuthorizedError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.UNAUTHORIZED;
        this.status = 'error';
    }
}
exports.NotAuthorizedError = NotAuthorizedError;
class FileTooLargeError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.REQUEST_TOO_LONG;
        this.status = 'error';
    }
}
exports.FileTooLargeError = FileTooLargeError;
class ServerError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.SERVICE_UNAVAILABLE;
        this.status = 'error';
    }
}
exports.ServerError = ServerError;
class JoiRequestValidationError extends CustomError {
    constructor(message) {
        // CALLS TO THE SUPER CLASS CONSTRUCTOR
        super(message);
        this.statusCode = http_status_codes_1.default.BAD_REQUEST;
        this.status = 'error';
    }
}
exports.JoiRequestValidationError = JoiRequestValidationError;
//# sourceMappingURL=error_handler.js.map