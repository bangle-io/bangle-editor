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
const { snakeCase } = require('change-case');
const docsConfig = require('../../api-docs.config.js')(Handlebars, (path) =>
  require.resolve(path),
);
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
  const obj = proxyLookup(context);
  return template(obj);
};

async function main() {
  const apiFiles = await getAPIDocs();
  // doing a force since bangle-website will
  // be outside of cwd.
  await del(apiDocsPath, { force: true });
  await fs.mkdir(apiDocsPath);
  const processedFiles = await processFiles(apiFiles);
  console.log('Done processing');
  await updateDocsSidebar(processedFiles);
  console.log('done :thumbsup!');
}

async function updateDocsSidebar(processedFiles) {
  const docsSidebar = JSON.parse(await fs.readFile(docsSidebarPath, 'utf-8'));
  let apiItem = docsSidebar.docs.find((r) => r.label === 'API');

  if (!apiItem) {
    throw new Error('Missing API label in docsSidebar');
  }

  apiItem.items = processedFiles
    .sort((a, b) => {
      const aWip = a.sidebar_label.includes('wip');
      const bWip = b.sidebar_label.includes('wip');
      if (aWip && !bWip) {
        return 1;
      }
      if (bWip && !aWip) {
        return -1;
      }

      return a.sidebar_label.localeCompare(b.sidebar_label);
    })
    .map((p) => `api/${p.id}`);

  await fs.writeFile(
    docsSidebarPath,
    JSON.stringify(docsSidebar, null, 2),
    'utf-8',
  );
}

async function processFiles(apiFiles) {
  const processed = [];
  for (const [filepath, text] of apiFiles) {
    console.log('Processing ', filepath);
    let template = await templatify(text, docsConfig.shorthands);
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

    if (snakeCase(data.id) !== data.id) {
      throw new Error(
        `${data.id} must be in snake_case ${snakeCase(data.id)}. `,
      );
    }

    if (processed.find((p) => p.id === data.id)) {
      throw new Error(`${data.id} is already in use`);
    }

    processed.push(data);

    // Change the new line syntax from trailing `\`  to `  ` two trailing spaces
    // due to differences in the engines (remark and markdownit ?) docusaurus does
    // not understanding trailing slash way of new line.
    template = template
      .split('\n')
      .map((r) => (r.endsWith('\\') ? r.slice(0, r.length - 1) + '  ' : r))
      .join('\n');

    await fs.writeFile(
      path.join(apiDocsPath, data.id + '.md'),
      template,
      'utf-8',
    );
  }

  return processed;
}

async function getAPIDocs() {
  const result = await globby(docsGlob);
  return Promise.all(
    result.map(async (path) => [path, await fs.readFile(path, 'utf-8')]),
  );
}

function proxyLookup(obj, parentName) {
  let handler = {
    get(target, propKey, receiver) {
      const path = parentName ? parentName + '.' + propKey : propKey;
      const targetValue = Reflect.get(target, propKey, receiver);
      if (targetValue == null) {
        throw new Error(`Missing value for "${path}"`);
      }

      if (typeof targetValue == 'object') {
        return proxyLookup(targetValue, path);
      }
      return targetValue;
    },
  };
  return new Proxy(obj, handler);
}
