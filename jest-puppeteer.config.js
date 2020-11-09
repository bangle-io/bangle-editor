// jest-puppeteer.config.js
module.exports = {
  server: [
    // {
    //   command:
    //     'NODE_ENV=integration yarn workspace bangle-play webpack serve --env development --port 4444 ',
    //   port: 4444,
    //   launchTimeout: 8000,
    // },
    {
      command:
        'NODE_ENV=integration yarn workspace bangle-react run webpack serve --config __integration_tests__/setup/webpack.config.js --mode development --port 4002 --host 0.0.0.0',
      port: 4002,
      launchTimeout: 8000,
    },
  ],
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
