module.exports = {
  testRunner: 'jest-circus/runner',
  testPathIgnorePatterns: [`<rootDir>/tooling/e2e-tests/`, `<rootDir>/.yarn`],
  transformIgnorePatterns: [
    'node_modules/(?!((@popperjs)|(debounce-fn)|(@bangle.dev/pm)|(prosemirror-utils-bangle))/)',
  ],
  setupFilesAfterEnv: ['@bangle.dev/jest-utils'],
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
      '<rootDir>/tooling/bangle-scripts/fileMock.cjs',
    '\\.(css)$': '<rootDir>/tooling/bangle-scripts/styleMock.cjs',
  },
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
};
