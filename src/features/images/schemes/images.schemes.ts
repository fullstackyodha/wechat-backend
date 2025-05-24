import Joi, { ObjectSchema } from 'joi';

const addImageScheme: ObjectSchema = Joi.object().keys({
	image: Joi.string().required().messages({
		'any.required': 'Image is a required property'
	})
});

export { addImageScheme };
