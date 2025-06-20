import fs from 'fs';
import ejs from 'ejs';
import { IResetPasswordParams } from '@user/interfaces/user.interface';

class ResetPasswordTemplate {
	public resetPasswordConfirmationTemplate(
		templateParams: IResetPasswordParams
	): string {
		const { username, email, ipaddress, date } = templateParams;

		// Render the given template of ejs.
		return ejs.render(
			// Synchronously reads the entire contents of a file.
			fs.readFileSync(__dirname + '/reset-password-template.ejs', 'utf8'),
			{
				username,
				email,
				ipaddress,
				date,
				image_url:
					'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.pngegg.com%2Fen%2Fsearch%3Fq%3Dlock%2BIcon&psig=AOvVaw2qUKCaqoL3AHcW8dXyC0on&ust=1694272837524000&source=images&cd=vfe&opi=89978449&ved=0CBAQjRxqFwoTCMjb8Yuom4EDFQAAAAAdAAAAABAp'
			}
		);
	}
}

export const resetPasswordTemplate: ResetPasswordTemplate = new ResetPasswordTemplate();
