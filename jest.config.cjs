/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: '<rootDir>/tests/jest-env-with-fetch.cjs',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
  },
  moduleNameMapper: {
    '\\.(css)$': '<rootDir>/tests/__mocks__/styleMock.cjs',
  },
  testMatch: ['<rootDir>/tests/**/*.test.(ts|tsx)'],
};
