import dotenv from 'dotenv';
import bunyan from 'bunyan';
import cloudinary from 'cloudinary';

dotenv.config({}); // .env file in the root folder no need to specify the path

class Config {
	public DATABASE_URL: string | undefined;
	public DATABASE_PASSWORD: string | undefined;

	public SERVER_PORT: string | undefined;
	public JWT_TOKEN: string | undefined;
	public NODE_ENV: string | undefined;
	public SECRET_KEY_1: string | undefined;
	public SECRET_KEY_2: string | undefined;
	public CLIENT_URL: string | undefined;
	public REDIS_HOST: string | undefined;

	public CLOUD_NAME: string | undefined;
	public CLOUD_API_KEY: string | undefined;
	public CLOUD_API_SECRET: string | undefined;

	public SENDER_EMAIL: string | undefined;
	public SENDER_EMAIL_PASSWORD: string | undefined;
	public SENDGRID_API_KEY: string | undefined;
	public SENDGRID_SENDER: string | undefined;

	constructor() {
		this.DATABASE_URL = process.env.DATABASE_URL;
		this.DATABASE_PASSWORD = process.env.DATABASE_PASSWORD;
		this.SERVER_PORT = process.env.SERVER_PORT;
		this.JWT_TOKEN = process.env.JWT_TOKEN || '';
		this.NODE_ENV = process.env.NODE_ENV || '';
		this.SECRET_KEY_1 = process.env.SECRET_KEY_1 || '';
		this.SECRET_KEY_2 = process.env.SECRET_KEY_2 || '';
		this.CLIENT_URL = process.env.CLIENT_URL || '';
		this.REDIS_HOST = process.env.REDIS_HOST || '';
		this.CLOUD_NAME = process.env.CLOUD_NAME || '';
		this.CLOUD_API_KEY = process.env.CLOUD_API_KEY || '';
		this.CLOUD_API_SECRET = process.env.CLOUD_API_SECRET || '';
		this.SENDER_EMAIL = process.env.SENDER_EMAIL || '';
		this.SENDER_EMAIL_PASSWORD = process.env.SENDER_EMAIL_PASSWORD || '';
		this.SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
		this.SENDGRID_SENDER = process.env.CLOUD_API_SECRET || '';
	}

	public validateConfig(): void {
		// Returns an array of key/values of the enumerable properties of THIS object
		for (const [key, value] of Object.entries(this)) {
			if (value === undefined) {
				throw new Error(`Configuration Error ${key} is undefined!!!`);
			}
		}
	}

	// CREATING LOGGER USING BUNYAN BY PASSING NAME TO IT
	public createLogger(name: string): bunyan {
		return bunyan.createLogger({ name, level: 'debug' });
	}

	// CONFIGURING CLOUDINARY
	public cloudinaryConfig(): void {
		cloudinary.v2.config({
			cloud_name: this.CLOUD_NAME,
			api_key: this.CLOUD_API_KEY,
			api_secret: this.CLOUD_API_SECRET
		});
	}
}

// Initializing and exporting
export const config: Config = new Config();
