// jest-puppeteer.config.js
module.exports = {
  server: {
    command: 'npm run test',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
