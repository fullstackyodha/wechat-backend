import {
	Application,
	json,
	urlencoded,
	Request,
	Response,
	NextFunction
} from 'express';

import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import cookieSession from 'cookie-session';
import compression from 'compression';
import HTTP_STATUS from 'http-status-codes';
import Logger from 'bunyan';

import 'express-async-errors';

import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';

import applicationRoutes from './routes';

import { config } from './config';
import {
	CustomError,
	IErrorResponse
} from './shared/globals/helpers/error_handler';

// INDICATES THAT ERROR CAME FROM SERVER FILE
const log: Logger = config.createLogger('server');

export class WechatServer {
	private app: Application;

	constructor(app: Application) {
		this.app = app;
	}

	public start(): void {
		this.securityMiddleware(this.app);
		this.standardMiddleware(this.app);
		this.routeMiddleware(this.app);
		this.globalHandler(this.app);
		this.startServer(this.app);
	}

	private securityMiddleware(app: Application): void {
		app.use(
			cookieSession({
				name: 'session',
				keys: [config.SECRET_KEY_1!, config.SECRET_KEY_2!],
				maxAge: 7 * 24 * 60 * 60 * 1000,
				secure: config.NODE_ENV !== 'development'
			})
		);

		app.use(hpp());

		app.use(helmet());

		app.use(
			// helps to make request to backend
			cors({
				origin: config.CLIENT_URL,
				credentials: true,
				optionsSuccessStatus: 200,
				methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
			})
		);
	}

	private standardMiddleware(app: Application): void {
		app.use(compression()); // helps in compressing size of req and res

		app.use(json({ limit: '50mb' })); // only parses json

		app.use(urlencoded({ extended: true, limit: '50mb' })); // only parses urlencoded bodies
	}

	private routeMiddleware(app: Application): void {
		applicationRoutes(app);
	}

	private globalHandler(app: Application): void {
		app.all('*', (req: Request, res: Response, next: NextFunction) => {
			res.status(HTTP_STATUS.NOT_FOUND).json({
				message: `${req.originalUrl} not found!!!`
			});
		});

		app.use(
			(
				error: IErrorResponse,
				req: Request,
				res: Response,
				next: NextFunction
			) => {
				log.error(error);

				// check if it is any of the child class error
				if (error instanceof CustomError) {
					return res.status(error.statusCode).json(error.serializeError());
				}

				next();
			}
		);
	}

	private async startServer(app: Application): Promise<void> {
		try {
			const httpServer: http.Server = new http.Server(app);

			const socketio: Server = await this.createSocketIO(httpServer);

			this.startHttpServer(httpServer);

			this.socketIOConnection(socketio);
		} catch (err) {
			log.error(err);
		}
	}

	private startHttpServer(httpServer: http.Server): void {
		log.info(`Server with pid ${process.pid} has started`);

		httpServer.listen(config.SERVER_PORT, () => {
			log.info('SERVER LISTENING ON PORT 5000!!!');
		});
	}

	// Runs multiple Socket.IO instances in different processes or servers
	// that can all broadcast and emit events to and from each other.
	private async createSocketIO(httpServer: http.Server): Promise<Server> {
		const io: Server = new Server(httpServer, {
			cors: {
				origin: config.CLIENT_URL,
				methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
			}
		});

		const pubClient = createClient({ url: config.REDIS_HOST });
		const subClient = pubClient.duplicate();

		await Promise.all([pubClient.connect(), subClient.connect()]);

		io.adapter(createAdapter(pubClient, subClient));

		return io;
	}

	private socketIOConnection(io: Server): void {}
}
