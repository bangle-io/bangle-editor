// jest-puppeteer.config.js
module.exports = {
  server: {
    command:
      'JEST_INTEGRATION=true parcel public/index.html --port 4444 --no-cache',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
