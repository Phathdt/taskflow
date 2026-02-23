import type { Config } from 'jest'

const config: Config = {
  projects: [
    '<rootDir>/apps/api',
    '<rootDir>/libs/auth',
    '<rootDir>/libs/custom-config',
    '<rootDir>/libs/custom-logger',
    '<rootDir>/libs/database',
    '<rootDir>/libs/share',
    '<rootDir>/libs/task',
    '<rootDir>/libs/user',
  ],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}

export default config
