module.exports = {
  testRunner: 'jest-circus/runner',
  testPathIgnorePatterns: [
    `<rootDir>/__integration-tests__/`,
    `<rootDir>/.yarn`,
  ],
  transformIgnorePatterns: ['node_modules/(?!((@popperjs)|(debounce-fn))/)'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: [
    `<rootDir>/.yarn`,
    '/node_modules/',
    '/test-helpers/',
  ],
  // collectCoverage: true,
  clearMocks: true,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/_bangle-scripts/fileMock.js',
    '\\.(css)$': '<rootDir>/_bangle-scripts/styleMock.js',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
