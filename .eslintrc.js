module.exports = {
  env: {
    browser: true,
    es6: true
  },
  extends: ['react-app'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    'no-prototype-builtins': 'off'
  }
};
