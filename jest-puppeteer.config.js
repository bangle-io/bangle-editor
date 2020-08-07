// jest-puppeteer.config.js
module.exports = {
  server: {
    command:
      'webpack-dev-server --mode development --open --port 3000 --port 4444 ',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
