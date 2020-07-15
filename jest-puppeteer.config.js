// jest-puppeteer.config.js
module.exports = {
  server: {
    command: 'PORT=4444 BROWSER=none react-scripts start',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
