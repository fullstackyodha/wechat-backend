import { IAuthDocument } from '@auth/interfaces/auth.interface';
import { hash, compare } from 'bcryptjs';
import { model, Model, Schema } from 'mongoose';

const SALT_ROUND = 10;

// CREATING SCHEMA OF AUTH USER
const authSchema: Schema = new Schema(
	{
		username: { type: String },
		uId: { type: String },
		email: { type: String },
		password: { type: String },
		avatarColor: { type: String },
		createdAt: { type: Date, default: Date.now },
		passwordResetToken: { type: String, default: '' },
		passwordResetExpires: { type: Number }
	},
	{
		toJSON: {
			// Returns the Record with no password property
			transform(_doc, record) {
				delete record.password;
				return record;
			}
		}
	}
);

// RUNS BEFORE SAVING THE CURRENT DOCUMENT TO THE DATABASE
authSchema.pre('save', async function (this: IAuthDocument, next: () => void) {
	// HASH PASSWORD STRING WITH SALT ROUNDS
	const hashedPassword: string = await hash(this.password as string, SALT_ROUND);

	// ASSIGN HASHED PASSWORD TO THE DOCUMENTS PASSWORD
	this.password = hashedPassword;

	// GO TO NEXT MIDDLEWARE
	next();
});

authSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
	// TAKE HASHED PASSWORD FROM CURRENT DOCUMENT
	const hashedPassword: string = (this as unknown as IAuthDocument).password!;

	// COMPARE HASHED PASSWORD AND GIVEN STRING PASSWORD
	return compare(password, hashedPassword);
};

authSchema.methods.hashPassword = async function (password: string): Promise<string> {
	return hash(password, SALT_ROUND);
};

// CREATING MODEL OF THE SCHEMA
const AuthModel: Model<IAuthDocument> = model<IAuthDocument>('Auth', authSchema, 'Auth');

export { AuthModel };
