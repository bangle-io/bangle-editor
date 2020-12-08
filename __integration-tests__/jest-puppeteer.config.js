// jest-puppeteer.config.js
module.exports = {
  server: [
    {
      command: 'yarn workspace integration-tests serve-build',
      port: 1234,
      launchTimeout: 10000,
    },
  ],
  launch: {
    // headless: false,
  },
  // connect: {
  //   browserWSEndpoint:
  //     'ws://127.0.0.1:9222/devtools/browser/363eec36-cb96-43a6-ae75-414542742899',
  // },
};
