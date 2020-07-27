// jest.config.js

module.exports = {
  preset: 'jest-puppeteer',
  testRunner: 'jest-circus/runner',
  modulePaths: ['<rootDir>/src'],
  testMatch: [
    // '**/tests-integration/**/*.[jt]s?(x)',
    '**/tests-integration/**/?(*.)+(spec|test).[jt]s?(x)',
  ],
};
