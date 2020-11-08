// jest-puppeteer.config.js
module.exports = {
  server: {
    command:
      'NODE_ENV=integration yarn workspace bangle-play webpack serve --env development --port 4444 ',
    port: 4444,
    launchTimeout: 8000,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
