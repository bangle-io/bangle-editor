/**
 * The goal of this script is to read api.md files
 * from various packages and put them in the `_bangle-website/docs/api`
 * directory after applying transformations. The transformation
 * read the `api-docs.config.json` and apply the config to each file.
 * For example a shorthand will be expanded, front-matter will get correct
 * data, etc.
 */

const globby = require('globby');
const path = require('path');
const fs = require('fs/promises');
const handlebars = require('handlebars');
main();

async function main() {
  const apiFiles = await getAPIDocs();
  const template = handlebars.compile(`helloe {{kushan}}`);
  console.log(template({ kushan: 'joshi' }));
}

async function getAPIDocs() {
  const result = await globby([
    path.join(__dirname, '..', '..', '**/api.md'),
    `!` + path.join(__dirname, '..', '..', '_bangle-website/**'),
    `!**/__tests__/**`,
  ]);
  return Promise.all(
    result.map(async (path) => [path, await fs.readFile(path, 'utf-8')]),
  );
}
