"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const setupServer_1 = require("./setupServer");
const setupDatabase_1 = __importDefault(require("./setupDatabase"));
const config_1 = require("./config");
class Application {
    initialize() {
        // Loading the config variables
        this.loadConfig();
        // connecting to database
        (0, setupDatabase_1.default)();
        // Creates an Express application
        const app = (0, express_1.default)();
        // Creating new WECHAT SERVER INSTANCE
        const server = new setupServer_1.WechatServer(app);
        // START WECHAT SERVER
        server.start();
    }
    loadConfig() {
        config_1.config.validateConfig();
    }
}
const application = new Application();
application.initialize();
// -r tsconfig-paths/register
// Use this to load modules whose location is specified
// in the paths section of tsconfig.json or jsconfig.json
//# sourceMappingURL=app.js.map