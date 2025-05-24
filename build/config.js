"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const bunyan_1 = __importDefault(require("bunyan"));
dotenv_1.default.config({}); // .env file in the root folder no need to specify the path
class Config {
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
    validateConfig() {
        // Returns an array of key/values of the enumerable properties of an object
        for (const [key, value] of Object.entries(this)) {
            if (value === undefined) {
                throw new Error(`Configuration Error ${key} is undefined!!!`);
            }
        }
    }
    createLogger(name) {
        return bunyan_1.default.createLogger({ name, level: 'debug' });
    }
}
exports.config = new Config();
//# sourceMappingURL=config.js.map