// jest-puppeteer.config.js
module.exports = {
  server: {
    command: 'parcel public/index.html --port 4444',
    port: 4444,
  },
  launch: {
    // headless: false,
    // slowMo: 50,
  },
};
