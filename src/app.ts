import express, { Express } from 'express';

import { WechatServer } from '@root/setupServer';
import { config } from '@root/config';
import databaseConnection from '@root/setupDatabase';
import Logger from 'bunyan';

const log: Logger = config.createLogger('app');

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

		Application.handleExit();
	}

	public loadConfig(): void {
		// VALIDATE THE CONFIG VARIABLES
		config.validateConfig();

		// CONFIG CLOUDINARY
		config.cloudinaryConfig();
	}

	private static handleExit(): void {
		process.on('uncaughtException', (error: Error) => {
			log.error(`There was an uncaught error: ${error}`);
			Application.shutDownProperly(1);
		});

		process.on('unhandleRejection', (reason: Error) => {
			log.error(`Unhandled rejection at promise: ${reason}`);
			Application.shutDownProperly(2);
		});

		process.on('SIGTERM', () => {
			log.error('Caught SIGTERM');
			Application.shutDownProperly(2);
		});

		process.on('SIGINT', () => {
			log.error('Caught SIGINT');
			Application.shutDownProperly(2);
		});

		process.on('exit', () => {
			log.error('Exiting');
		});
	}

	private static shutDownProperly(exitCode: number): void {
		Promise.resolve()
			.then(() => {
				log.info('Shutdown complete');
				process.exit(exitCode);
			})
			.catch((error) => {
				log.error(`Error during shutdown: ${error}`);
				process.exit(1);
			});
	}
}

const application: Application = new Application();
application.initialize();

// -r tsconfig-paths/register
// Use this to load modules whose location is specified
// in the paths section of tsconfig.json or jsconfig.json
