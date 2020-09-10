// jest.config.js

const { workspaces } = require('./package.json');

module.exports = {
  testRunner: 'jest-circus/runner',
  modulePaths: workspaces.map((w) => `<rootDir>/${w}`),
  testPathIgnorePatterns: workspaces.map(
    (w) => `<rootDir>/${w}/tests-integration/`,
  ),
};
