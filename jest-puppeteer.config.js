// jest-puppeteer.config.js
module.exports = {
  server: [
    // {
    //   command:
    //     'NODE_ENV=integration yarn workspace bangle-play webpack serve --env development --port 4444 ',
    //   port: 4444,
    //   launchTimeout: 16000,
    // },
    // {
    //   command:
    //     'NODE_ENV=integration yarn workspace bangle-react run webpack serve --config __integration_tests__/setup/webpack.config.js --mode development --port 4002 --host 0.0.0.0',
    //   port: 4002,
    //   launchTimeout: 16000,
    // },

    {
      command:
        'yarn workspace integration-tests build && yarn workspace integration-tests serve-build',
      port: 1234,
      launchTimeout: 16000,
    },
  ],
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
