// jest-puppeteer.config.js
module.exports = {
  server: {
    command: 'NODE_ENV=integration webpack-dev-server --open --port 4444 ',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
