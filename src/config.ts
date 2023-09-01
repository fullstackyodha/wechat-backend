import dotenv from 'dotenv';
import bunyan from 'bunyan';

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
	}

	public validateConfig(): void {
		// Returns an array of key/values of the enumerable properties of an object
		for (const [key, value] of Object.entries(this)) {
			if (value === undefined) {
				throw new Error(`Configuration Error ${key} is undefined!!!`);
			}
		}
	}

	public createLogger(name: string): bunyan {
		return bunyan.createLogger({ name, level: 'debug' });
	}
}

export const config: Config = new Config();
