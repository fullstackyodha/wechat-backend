"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config");
// INDICATES THAT ERROR CAME FROM SERVER FILE
const log = config_1.config.createLogger('databaseSetup');
function default_1() {
    const connect = () => {
        // Replacing password with our password variable from env
        const database_url = config_1.config.DATABASE_URL.replace('<password>', config_1.config.DATABASE_PASSWORD);
        mongoose_1.default
            .connect(database_url)
            .then(() => log.info('DATABASE SUCCESSFULLY CONNECTED!!!'))
            .catch(() => {
            log.error('ERROR CONNECTING DATABASE!!!');
            return process.exit(1);
        });
    };
    connect();
    // if not connected then it tries to connect again
    mongoose_1.default.connection.on('disconnection', connect);
}
exports.default = default_1;
//# sourceMappingURL=setupDatabase.js.map