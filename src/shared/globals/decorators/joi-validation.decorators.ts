import { JoiRequestValidationError } from '@global/helpers/error_handler';
import { Request } from 'express';
import { ObjectSchema } from 'joi';

// DECORATOR
type IJoiDecorator = (target: any, key: string, descriptor: PropertyDescriptor) => void;

// VALIDATE PROPERTIES PASSED IN REQUEST BODY
export function joiValidation(schema: ObjectSchema): IJoiDecorator {
	//
	return (_target: any, _key: string, descriptor: PropertyDescriptor) => {
		const originalMethod = descriptor.value;
		// console.log('Descriptor: ', descriptor);
		// console.log('Original Method: ', originalMethod); // create()

		// args = [req, res, next]
		descriptor.value = async function (...args: any[]) {
			const req: Request = args[0];

			// Validates a value using the schema and options.
			const { error } = await Promise.resolve(schema.validate(req.body));

			if (error?.details) {
				throw new JoiRequestValidationError(error?.details[0].message);
			}

			return originalMethod.apply(this, args);
		};

		return descriptor;
	};
}
