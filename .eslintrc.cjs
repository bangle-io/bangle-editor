// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',

    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
  ],
  plugins: ['simple-import-sort'],

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
    'import/newline-after-import': ['error', { count: 1 }],
    'simple-import-sort/imports': [
      'error',
      {
        groups: [
          ['^\\u0000'],
          ['^@?(?!bangle)\\w', '^'],
          ['^@bangle\\.dev?\\w'],
          ['^\\.'],
        ],
      },
    ],
    'simple-import-sort/exports': 'error',
    'curly': 'error',
    'no-process-env': 'error',
    'no-debugger': 'error',
    'import/no-cycle': [
      2,
      // eslint-disable-next-line no-process-env
      { maxDepth: process.env.EsLintCycle ? 3 : 1 },
    ],
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
