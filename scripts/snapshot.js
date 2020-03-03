const ts = require('date-fns/format')(new Date(), 'MMM-dd').toLocaleLowerCase();
require('child_process').execSync(
  `./node_modules/.bin/surge build bangle-${ts}.surge.sh`,
  { stdio: [0, 1, 2] },
);
