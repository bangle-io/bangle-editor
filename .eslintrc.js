// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',

    'plugin:import/errors',
    'plugin:import/warnings',
  ],
  env: {
    jest: true,
  },
  globals: {
    page: true,
    browser: true,
    context: true,
    jestPuppeteer: true,
    Node: 'off',
    Selection: 'off',
    Plugin: 'off',
    Image: 'off',
  },
  rules: {
    'curly': 'error',
    'no-process-env': 'error',
    // eslint-disable-next-line no-process-env
    'import/no-cycle': [2, { maxDepth: process.env.CI ? 5 : 2 }],
    // 'react/prop-types': ['error'],
    // 'import/no-unused-modules': [1, { unusedExports: true }],
  },
  settings: {
    jest: {
      version: '26',
    },
    react: {
      version: '16',
    },
  },
};
