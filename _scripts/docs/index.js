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
const Handlebars = require('handlebars');
const del = require('del');
const frontmatter = require('@github-docs/frontmatter');
const { paramCase } = require('change-case');
const docsConfig = require('../../api-docs.config.js');
const rootPath = path.join(__dirname, '..', '..');
const websitePath = path.join(rootPath, '_bangle-website');
const apiDocsPath = path.join(websitePath, 'docs', 'api');
const docsSidebarPath = path.join(websitePath, 'docsSidebar.json');
const docsGlob = [
  // Read any `api.md` file in the workspace packages
  path.join(rootPath, '**/api.md'),
  '!' + path.join(rootPath, '_bangle-website/**'),
  '!' + path.join(rootPath, '_bangle-play/**'),
  '!' + path.join(rootPath, '.yarn/**'),
  `!**/__tests__/**`,
];

main();

const templatify = (text, context) => {
  const template = Handlebars.compile(text);
  const obj = checkForMissingValues(context);
  return template(obj);
};

async function main() {
  const apiFiles = await getAPIDocs();
  await del(apiDocsPath);
  await fs.mkdir(apiDocsPath);
  const processedIds = await processFiles(apiFiles);
  console.log('Done processing');
  await updateDocsSidebar(processedIds);
  console.log('done :thumbsup!');
}

async function updateDocsSidebar(processedIds) {
  const docsSidebar = JSON.parse(await fs.readFile(docsSidebarPath, 'utf-8'));
  let apiItem = docsSidebar.docs.find((r) => r.label === 'API');

  if (!apiItem) {
    throw new Error('Missing API label in docsSidebar');
  }

  apiItem.items = processedIds.map((id) => `api/${id}`);

  await fs.writeFile(
    docsSidebarPath,
    JSON.stringify(docsSidebar, null, 2),
    'utf-8',
  );
}

async function processFiles(apiFiles) {
  const processedIds = [];
  for (const [filepath, text] of apiFiles) {
    console.log('Processing ', filepath);
    const template = await templatify(text, docsConfig.shorthands);
    const { data, errors } = frontmatter(text, { filepath });
    if (errors && errors.length > 0) {
      console.log(errors);
      throw new Error('Error happened parsing frontmatter');
    }

    if (!data.packageName) {
      throw new Error('FrontMatter field "packageName" missing in ' + filepath);
    }

    if (typeof data.id !== 'string') {
      throw new Error('FrontMatter field "id" must be string type' + filepath);
    }

    if (paramCase(data.id) !== data.id) {
      throw new Error(`${data.id} must be in kebab-case.`);
    }

    if (processedIds.includes(data.id)) {
      throw new Error(`${data.id} is already in use`);
    }

    processedIds.push(data.id);
    await fs.writeFile(
      path.join(apiDocsPath, data.id + '.md'),
      template,
      'utf-8',
    );
  }

  return processedIds;
}

async function getAPIDocs() {
  const result = await globby(docsGlob);
  return Promise.all(
    result.map(async (path) => [path, await fs.readFile(path, 'utf-8')]),
  );
}

function checkForMissingValues(obj, parentName) {
  let handler = {
    get(target, propKey, receiver) {
      const path = parentName ? parentName + '.' + propKey : propKey;
      const targetValue = Reflect.get(target, propKey, receiver);
      if (targetValue == null) {
        throw new Error(`Missing value for "${path}"`);
      }

      if (typeof targetValue == 'object') {
        return checkForMissingValues(targetValue, path);
      }
      return targetValue;
    },
  };
  return new Proxy(obj, handler);
}
