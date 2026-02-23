import type { Config } from 'jest'

const config: Config = {
  projects: [
    '<rootDir>/apps/api',
    '<rootDir>/libs/custom-config',
    '<rootDir>/libs/custom-logger',
    '<rootDir>/libs/database',
    '<rootDir>/libs/share',
  ],
  collectCoverageFrom: ['**/*.ts', '!**/*.spec.ts', '!**/node_modules/**', '!**/dist/**'],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
}

export default config
