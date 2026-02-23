import type { Config } from 'jest'

const config: Config = {
  displayName: 'auth',
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
  },
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleNameMapper: {
    '^@taskflow/custom-config$': '<rootDir>/../custom-config/src/index',
    '^@taskflow/custom-logger$': '<rootDir>/../custom-logger/src/index',
    '^@taskflow/database$': '<rootDir>/../database/src/index',
    '^@taskflow/share$': '<rootDir>/../share/src/index',
    '^@taskflow/user$': '<rootDir>/../user/src/index',
  },
  collectCoverageFrom: ['src/**/*.ts', '!src/**/*.spec.ts', '!src/index.ts'],
  coverageDirectory: '../../coverage/libs/auth',
}

export default config
