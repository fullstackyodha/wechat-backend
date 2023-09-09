import { Request, Response } from 'express';
import HTTP_STATUS from 'http-status-codes';
import crypto from 'crypto';
import publicIp from 'ip';
import moment from 'moment';

import { config } from '@root/config';
import { authService } from '@service/db/auth.service';
import { BadRequestError } from '@global/helpers/error_handler';
import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { joiValidation } from '@global/decorators/joi-validation.decorators';
import { emailSchema, passwordSchema } from '@auth/schemes/password';
import { forgotPasswordTemplate } from '@service/email/templates/forgot-password/forgot-password-template';
import { emailQueue } from '@service/queues/email.queue';
import { IResetPasswordParams } from '@user/interfaces/user.interface';
import { resetPasswordTemplate } from '@service/email/templates/reset-password/reset-password-template';

export class Password {
	// FORGOT PASSWORD
	@joiValidation(emailSchema)
	public async create(req: Request, res: Response): Promise<void> {
		const { email } = req.body;

		const exisitingUser: IAuthDocument = await authService.getAuthUserByEmail(email);

		if (!exisitingUser) {
			throw new BadRequestError('Invalid Credentials');
		}

		// Generates cryptographically strong pseudorandom data.
		const randomByte: Buffer = await Promise.resolve(crypto.randomBytes(20));

		// Decodes buf to a string according to the specified character encoding inencoding
		const randomChars: string = randomByte.toString('hex');

		await authService.updatePasswordToken(
			`${exisitingUser._id}`,
			randomChars,
			Date.now() * 1 * 60 * 60 * 1000 // valid only for one hour. 1 * 60 * 60 * 1000
		);

		const resetLink = `${config.CLIENT_URL}/reset-password?token=${randomChars}`;

		const template: string = forgotPasswordTemplate.forgotPasswordTemplate(
			exisitingUser.username!,
			resetLink
		);

		emailQueue.addEmailJob('forgotPassword', {
			template,
			receiverEmail: email,
			subject: 'Reset Your Password'
		});

		res.status(HTTP_STATUS.OK).json({ message: 'Password reset email sent.' });
	}

	// RESET/UPDATE PASSWORD
	@joiValidation(passwordSchema)
	public async update(req: Request, res: Response): Promise<void> {
		const { password, confirmPassword } = req.body;
		const { token } = req.params;

		if (password !== confirmPassword) {
			throw new BadRequestError('Passwords Dont Match!!!');
		}

		const exisitingUser: IAuthDocument = await authService.getAuthUserByToken(token);

		if (!exisitingUser) {
			throw new BadRequestError('Reset Token has expired!!!');
		}

		exisitingUser.password = password;
		exisitingUser.passwordResetToken = undefined;
		exisitingUser.passwordResetExpires = undefined;
		await exisitingUser.save();

		const templateParams: IResetPasswordParams = {
			username: exisitingUser.username,
			email: exisitingUser.email,
			ipaddress: publicIp.address(),
			date: moment().format('DD/MM/YYYY HH:mm')
		};

		const template: string =
			resetPasswordTemplate.resetPasswordConfirmationTemplate(templateParams);

		emailQueue.addEmailJob('forgotPassword', {
			template,
			receiverEmail: exisitingUser.email,
			subject: 'Password Reset Confirmation.'
		});

		res.status(HTTP_STATUS.OK).json({ message: 'Password successfully updated.' });
	}
}
