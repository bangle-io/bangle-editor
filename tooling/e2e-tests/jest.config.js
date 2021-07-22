// jest.config.js

module.exports = {
  preset: 'jest-puppeteer',
  testRunner: 'jest-circus/runner',
  modulePaths: ['<rootDir>'],
  testMatch: ['<rootDir>/**/?(*.)+(spec|test).[jt]s?(x)'],
};
