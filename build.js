let child = require('child_process'),
  fs = require('fs'),
  path = require('path');

const buildOptions = {
  tsOptions: { allowSyntheticDefaultImports: true },
};

const libs = [
  './components/base-components',
  //   'components/emoji',
  //   'components/markdown-front-matter',
  //   'components/react-emoji-suggest',
  //   'components/react-menu',
  //   'components/react-sticker',
  //   'components/react-stopwatch',
  //   'components/search',
  //   'components/table',
  //   'components/text-formatting',
  //   'components/timestamp',
  //   'components/tooltip',
  //   'components/trailing-node',
  //   'components/wiki-link',
  //   'lib/broader-unit-tests',
  //   'lib/collab-client',
  //   'lib/collab-server',
  //   'lib/core',
  //   'lib/disk',
  //   'lib/markdown',
  //   'lib/pm',
  //   'lib/pm-commands',
  //   'lib/react',
  //   'lib/utils',
];

let projectDir = __dirname;

function joinP(...args) {
  return path.join(projectDir, ...args);
}

function mainFile(pkg) {
  let index = joinP(pkg, 'src', 'index.ts'),
    self = joinP(pkg, 'src', pkg + '.ts');

  console.log({ index, self });
  if (fs.existsSync(index)) {
    return index;
  }
  if (fs.existsSync(self)) {
    return self;
  }
  throw new Error("Couldn't find a main file for " + pkg);
}

async function build() {
  console.info('Building...');
  let t0 = Date.now();
  await require('@marijn/buildtool').build(libs.map(mainFile), buildOptions);
  console.info(`Done in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

build();
