import nodemailer from 'nodemailer';
// Creates an object for exposing the Mail API
import Mail from 'nodemailer/lib/mailer';
import sendgridmail from '@sendgrid/mail';

import Logger from 'bunyan';
import { config } from '@root/config';
import { BadRequestError } from '@global/helpers/error_handler';

interface IMailOptions {
	from: string;
	to: string;
	subject: string;
	html: string;
}

const log: Logger = config.createLogger('mailOptions');

// SendGrid API key passthrough for convenience.
sendgridmail.setApiKey(config.SENDGRID_API_KEY!);

class MailTransport {
	public async sendEmail(
		receiverEmail: string,
		subject: string,
		body: string
	): Promise<void> {
		if (config.NODE_ENV === 'development' || config.NODE_ENV === 'test') {
			this.developmentEmailSender(receiverEmail, subject, body);
		}

		if (config.NODE_ENV === 'production') {
			this.productionEmailSender(receiverEmail, subject, body);
		}
	}

	// DEVELOPMENT MAIL SENDER
	private async developmentEmailSender(
		receiverEmail: string,
		subject: string,
		body: string
	): Promise<void> {
		// CREATING NODEMAILER TRANSPORTER
		const transporter: Mail = nodemailer.createTransport({
			host: 'smtp.ethereal.email',
			port: 587,
			secure: false,
			auth: {
				user: config.SENDER_EMAIL,
				pass: config.SENDER_EMAIL_PASSWORD
			}
		});

		const mailOptions: IMailOptions = {
			from: `Wechat App <${config.SENDER_EMAIL}>`,
			to: receiverEmail,
			subject,
			html: body
		};

		try {
			// Sends an email using the preselected transport object
			const info = await transporter.sendMail(mailOptions);
			console.log('Message sent: %s', info.messageId);
			log.info('Development Email sent sucessfully');
		} catch (error) {
			log.error('Error Sending Mail. ', error);
			throw new BadRequestError('Error Sending Mail.');
		}
	}

	// PRODUCTION MAIL SENDER
	private async productionEmailSender(
		receiverEmail: string,
		subject: string,
		body: string
	): Promise<void> {
		const mailOptions: IMailOptions = {
			from: `Wechat App <${config.SENDER_EMAIL}>`,
			to: receiverEmail,
			subject,
			html: body
		};

		try {
			// Sends an email
			await sendgridmail.send(mailOptions);
			log.info('Production Email sent sucessfully');
		} catch (error) {
			log.error('Error Sending Mail. ', error);
			throw new BadRequestError('Error Sending Mail.');
		}
	}
}

export const mailTransport: MailTransport = new MailTransport();
