import { JoiRequestValidationError } from '@global/helpers/error_handler';
import { NextFunction, Request, Response } from 'express';
import { ObjectSchema } from 'joi';

// DECORATOR - RETURNS A FUNCTION WITH THESE PROPERTIES WHICH RETURNS VOID
type IJoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void;

// VALIDATE PROPERTIES PASSED IN REQUEST BODY
export function joiValidation(schema: ObjectSchema): IJoiDecorator {
	// RETURNS OF TYPE IJoiDecorator
	return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		// console.log('Descriptor: ', descriptor);
		// console.log('Original Method: ', originalMethod); // create()

		// args = [req, res, next]
		descriptor.value = async function (...args: [Request, Response, NextFunction]) {
			const req: Request = args[0];

			// Validates REQUEST BODY using the schema and options.
			// WE ALSO CAN USE ValidateAsync within TRY-CATCH
			const { error } = await Promise.resolve(schema.validate(req.body));

			if (error?.details) {
				throw new JoiRequestValidationError(error?.details[0].message);
			}

			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
