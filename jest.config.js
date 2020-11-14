// jest.config.js

const { workspaces } = require('./package.json');

module.exports = {
  testRunner: 'jest-circus/runner',
  modulePaths: workspaces.map((w) => `<rootDir>/${w}`),
  testPathIgnorePatterns: [
    ...workspaces.map((w) => `<rootDir>/${w}/__integration_tests__/`),
  ],
  transformIgnorePatterns: ['node_modules/(?!(@popperjs)/)'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  // collectCoverage: true,
  clearMocks: true,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/scripts/fileMock.js',
    '\\.(css)$': '<rootDir>/scripts/styleMock.js',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
