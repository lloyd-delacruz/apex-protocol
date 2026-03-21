/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.json' }],
  },
  moduleNameMapper: {
    // Resolve workspace package to its source during tests
    '^@apex/shared$': '<rootDir>/../packages/shared/src/index.ts',
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: true,
};
