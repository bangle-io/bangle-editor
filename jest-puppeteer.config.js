// jest-puppeteer.config.js
module.exports = {
  server: {
    command:
      'NODE_ENV=integration yarn workspace bangle-play webpack-dev-server --port 4444 ',
    port: 4444,
    launchTimeout: 8000,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
