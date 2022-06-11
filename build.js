let fs = require('fs');
let path = require('path');

const buildOptions = {
  tsOptions: {
    types: [],
    noUnusedLocals: false,
    lib: ['ES2019', 'dom', 'scripthost'],
    allowSyntheticDefaultImports: true,
    jsx: 'react',
  },
};

async function readPackages() {
  const yarnWorkspacesListOutput = require('child_process')
    .execSync(`yarn workspaces list --json`)
    .toString()
    .split('\n')
    .filter(Boolean);
  let result = await Promise.all(
    yarnWorkspacesListOutput
      .map((r) => JSON.parse(r))
      .map(async (r) => {
        const _path = path.join(
          path.resolve(__dirname, r.location),
          'package.json',
        );

        const file = fs.readFileSync(_path, 'utf-8');
        const packageJSON = JSON.parse(file);

        return { ...r, packageJSON };
      }),
  );

  return result;
}

let projectDir = __dirname;

function joinP(...args) {
  return path.join(projectDir, ...args);
}

function mainFile(pkg) {
  let index = joinP(pkg, 'src', 'index.ts');

  if (fs.existsSync(index)) {
    return index;
  }
  throw new Error("Couldn't find a main file for " + pkg);
}

async function build() {
  console.info('Building...');
  let t0 = Date.now();

  const list = (await readPackages()).filter((r) => {
    return !r.packageJSON.private;
  });
  // await require('@marijn/buildtool').watch(
  //   libs.map(mainFile),
  //   [],
  //   buildOptions,
  // );
  await require('@marijn/buildtool').build(
    list.map((obj) => {
      console.log('Working on ', obj.location);
      return mainFile(obj.location);
    }),
    buildOptions,
  );

  console.info(`Done in ${((Date.now() - t0) / 1000).toFixed(2)}s`);
}

build();
