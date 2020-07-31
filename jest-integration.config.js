// jest.config.js

module.exports = {
  preset: 'jest-puppeteer',
  testRunner: 'jest-circus/runner',
  modulePaths: ['<rootDir>/src'],
  testMatch: ['**/tests-integration/**/?(*.)+(spec|test).[jt]s?(x)'],
};
