module.exports = {
  testRunner: 'jest-circus/runner',
  testPathIgnorePatterns: [`<rootDir>/__integration-tests__/`],
  transformIgnorePatterns: ['node_modules/(?!(@popperjs)/)'],
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  coveragePathIgnorePatterns: ['/node_modules/', '/test-helpers/'],
  // collectCoverage: true,
  clearMocks: true,
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/scripts/fileMock.js',
    '\\.(css)$': '<rootDir>/scripts/styleMock.js',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
