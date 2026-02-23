import type { Config } from 'jest'

const config: Config = {
  displayName: 'user',
  testEnvironment: 'node',
  rootDir: '.',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
    '^.+\\.js$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
      },
    ],
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@taskflow/custom-config$': '<rootDir>/../custom-config/src/index',
    '^@taskflow/custom-logger$': '<rootDir>/../custom-logger/src/index',
    '^@taskflow/database$': '<rootDir>/../database/src/index',
    '^@taskflow/database/(.*)$': '<rootDir>/../database/src/$1',
    '^@taskflow/share$': '<rootDir>/../share/src/index',
  },
  transformIgnorePatterns: ['/node_modules/(?!(uuid|pino-pretty)/)'],
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/index.ts'],
  coverageDirectory: '../../coverage/libs/user',
}

export default config
