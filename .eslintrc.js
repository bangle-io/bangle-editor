// .eslintrc.js
module.exports = {
  extends: [
    'react-app',

    /*'plugin:import/errors', 'plugin:import/warnings'*/
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
  },
  ignorePatterns: ['/archive', '.cache', '/build', '/dist'],
  rules: {
    // 'import/no-unused-modules': [1, { unusedExports: true }],
  },
  settings: {},
};
