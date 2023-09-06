import express, { Express } from 'express';
import { WechatServer } from '@root/setupServer';
import databaseConnection from '@root/setupDatabase';
import { config } from '@root/config';

class Application {
	public initialize(): void {
		// Loading the config variables
		this.loadConfig();

		// connecting to database
		databaseConnection();

		// Creates an Express application
		const app: Express = express();
		// Creating new WECHAT SERVER INSTANCE
		const server: WechatServer = new WechatServer(app);

		// START WECHAT SERVER
		server.start();
	}

	public loadConfig(): void {
		// VALIDATE THE CONFIG VARIABLES
		config.validateConfig();

		// CONFIG CLOUDINARY
		config.cloudinaryConfig();
	}
}

const application: Application = new Application();
application.initialize();

// -r tsconfig-paths/register
// Use this to load modules whose location is specified
// in the paths section of tsconfig.json or jsconfig.json
