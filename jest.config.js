const nextJest = require('next/jest');

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Don't change, this is needed to load next.config.js and .env config
  dir: './',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  globals: {
    fetch,
  },
});

module.exports = createJestConfig();
