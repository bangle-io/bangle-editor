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
    // slowMo: 20,
    // headless: false,
  },

  // To run on chrome
  // /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
  // connect: {
  //   browserWSEndpoint:
  //     'ws://127.0.0.1:9222/devtools/browser/9ade75ab-631a-4504-a7ee-e9610fdbb606',
  // },
};
