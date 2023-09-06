"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WechatServer = void 0;
const express_1 = require("express");
const http_1 = __importDefault(require("http"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const hpp_1 = __importDefault(require("hpp"));
const cookie_session_1 = __importDefault(require("cookie-session"));
const compression_1 = __importDefault(require("compression"));
const http_status_codes_1 = __importDefault(require("http-status-codes"));
require("express-async-errors");
const socket_io_1 = require("socket.io");
const redis_1 = require("redis");
const redis_adapter_1 = require("@socket.io/redis-adapter");
const routes_1 = __importDefault(require("./routes"));
const config_1 = require("./config");
const error_handler_1 = require("./shared/globals/helpers/error_handler");
// import {
// 	CustomError,
// 	IErrorResponse
// } from './shared/globals/helpers/error_handler';
// INDICATES THAT ERROR CAME FROM SERVER FILE
const log = config_1.config.createLogger('server');
class WechatServer {
    constructor(app) {
        this.app = app;
    }
    start() {
        this.securityMiddleware(this.app);
        this.standardMiddleware(this.app);
        this.routeMiddleware(this.app);
        this.globalHandler(this.app);
        this.startServer(this.app);
    }
    securityMiddleware(app) {
        app.use((0, cookie_session_1.default)({
            name: 'session',
            keys: [config_1.config.SECRET_KEY_1, config_1.config.SECRET_KEY_2],
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: config_1.config.NODE_ENV !== 'development'
        }));
        app.use((0, hpp_1.default)());
        app.use((0, helmet_1.default)());
        app.use(
        // helps to make request to backend
        (0, cors_1.default)({
            origin: config_1.config.CLIENT_URL,
            credentials: true,
            optionsSuccessStatus: 200,
            methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
        }));
    }
    standardMiddleware(app) {
        app.use((0, compression_1.default)()); // helps in compressing size of req and res
        app.use((0, express_1.json)({ limit: '50mb' })); // only parses json
        app.use((0, express_1.urlencoded)({ extended: true, limit: '50mb' })); // only parses urlencoded bodies
    }
    routeMiddleware(app) {
        (0, routes_1.default)(app);
    }
    globalHandler(app) {
        app.all('*', (req, res, next) => {
            res.status(http_status_codes_1.default.NOT_FOUND).json({
                message: `${req.originalUrl} not found!!!`
            });
        });
        app.use((error, req, res, next) => {
            log.error(error);
            // check if it is any of the child class error
            if (error instanceof error_handler_1.CustomError) {
                return res.status(error.statusCode).json(error.serializeError());
            }
            next();
        });
    }
    async startServer(app) {
        try {
            const httpServer = new http_1.default.Server(app);
            const socketio = await this.createSocketIO(httpServer);
            this.startHttpServer(httpServer);
            this.socketIOConnection(socketio);
        }
        catch (err) {
            log.error(err);
        }
    }
    startHttpServer(httpServer) {
        log.info(`Server with pid ${process.pid} has started`);
        httpServer.listen(config_1.config.SERVER_PORT, () => {
            log.info('SERVER LISTENING ON PORT 5000!!!');
        });
    }
    // Runs multiple Socket.IO instances in different processes or servers
    // that can all broadcast and emit events to and from each other.
    async createSocketIO(httpServer) {
        const io = new socket_io_1.Server(httpServer, {
            cors: {
                origin: config_1.config.CLIENT_URL,
                methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS']
            }
        });
        const pubClient = (0, redis_1.createClient)({ url: config_1.config.REDIS_HOST });
        const subClient = pubClient.duplicate();
        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter((0, redis_adapter_1.createAdapter)(pubClient, subClient));
        return io;
    }
    socketIOConnection(io) { }
}
exports.WechatServer = WechatServer;
//# sourceMappingURL=setupServer.js.map