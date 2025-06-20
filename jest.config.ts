import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	verbose: true,
	coverageDirectory: 'coverage',
	collectCoverage: true,
	testPathIgnorePatterns: ['/node_modules/'],
	transform: {
		'^.+\\.ts?$': 'ts-jest'
	},
	testMatch: ['<rootDir>/src/**/test/*.ts'],
	// Only from ts files only
	collectCoverageFrom: ['src/**/*.ts', '!src/**/test/*.ts?(x)', '!**/node_modules/**'],
	coverageThreshold: {
		global: {
			branches: 1,
			functions: 1,
			lines: 1,
			statements: 1
		}
	},
	coverageReporters: ['text-summary', 'lcov'],
	moduleNameMapper: {
		'@auth/(.*)': ['<rootDir>/src/features/auth/$1'],
		'@post/(.*)': ['<rootDir>/src/features/post/$1'],
		'@reaction/(.*)': ['<rootDir>/src/features/reactions/$1'],
		'@comment/(.*)': ['<rootDir>/src/features/comments/$1'],
		'@user/(.*)': ['<rootDir>/src/features/user/$1'],
		'@connections/(.*)': ['<rootDir>/src/features/connections/$1'],
		'@notifications/(.*)': ['<rootDir>/src/features/notifications/$1'],
		'@chats/(.*)': ['<rootDir>/src/features/chats/$1'],
		'@images/(.*)': ['<rootDir>/src/features/images/$1'],
		'@global/(.*)': ['<rootDir>/src/shared/globals/$1'],
		'@service/(.*)': ['<rootDir>/src/shared/services/$1'],
		'@socket/(.*)': ['<rootDir>/src/shared/sockets/$1'],
		'@worker/(.*)': ['<rootDir>/src/shared/workers/$1'],
		'@root/(.*)': ['<rootDir>/src/$1']
	}
};

export default config;
