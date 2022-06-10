const path = require('path');
const globby = require('globby');
const fs = require('fs/promises');
const rootPath = path.resolve(__dirname, '..', '..');

module.exports = { getPackages, mapPackages };

async function getPackages({ filter = 'all' } = {}) {
  const globResults = await globby([path.join(rootPath, '**/package.json')]);
  // console.log({ globResults });
  let results = await Promise.all(
    globResults.map(async (path) => [
      path,
      JSON.parse(await fs.readFile(path, 'utf-8')),
    ]),
  );

  results = results.filter(([filePath, packageObj]) => {
    if (filter === 'private') {
      return packageObj.private;
    }
    if (filter === 'public') {
      return !packageObj.private;
    }

    return true;
  });
  console.log(results);
  return results;
}

// cb - ([packagePath, packageObj]) => packageObj
async function mapPackages(cb, { filter } = {}) {
  const result = (await getPackages({ filter })).map((r) => {
    return [r[0], cb(r)];
  });

  await Promise.all(
    result.map(([packagePath, packageObj]) => {
      return fs.writeFile(
        packagePath,
        JSON.stringify(packageObj, null, 2) + '\n',
        'utf-8',
      );
    }),
  );
}

mapPackages(([filePath, packageObj]) => {
  let obj = {
    ...packageObj,
    type: 'module',
    main: 'dist/index.cjs',
    module: 'dist/index.js',
    types: 'dist/index.d.ts',
    exports: {
      import: './dist/index.js',
      require: './dist/index.cjs',
    },
  };
  return Object.fromEntries(
    Object.entries({
      name: packageObj.name,
      version: packageObj.version,
      homepage: packageObj.homepage,
      authors: packageObj.authors,
      private: packageObj.private,
      type: packageObj.type,
      main: packageObj.main,
      module: packageObj.module,
      types: packageObj.types,
      exports: packageObj.exports,
      ...obj,
    }),
  );
});
