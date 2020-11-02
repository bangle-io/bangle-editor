const { uuid } = require('bangle-core/utils/js-utils');
const prettier = require('prettier');

const ctrlKey = process.env.CI ? 'Control' : 'Meta';
const EDITOR_ID = `bangle-play`;
const EDITOR_SELECTOR = `[id^='${EDITOR_ID}']`;

module.exports = {
  mountEditor,
  getEditorState,
  ctrlKey,
  getDoc,
  sleep,
  EDITOR_SELECTOR,
  uniqDatabaseUrl,
};

function uniqDatabaseUrl() {
  return `http://localhost:4444?database=databse-${uuid(2)}`;
}

function frmt(doc) {
  return prettier.format(doc.toString(), {
    semi: false,
    parser: 'babel',
    printWidth: 36,
    singleQuote: true,
  });
}
async function mountEditor(page, props) {
  await page.waitForSelector(EDITOR_SELECTOR);
  await page.waitForSelector('.ProseMirror', { timeout: 500 });
  await page.click(EDITOR_SELECTOR);
  // let the collab  settle down
  await sleep(50);
}

async function getEditorState(page) {
  return page.evaluate(() => {
    return window.editor.state.toJSON();
  });
}

async function getDoc(page) {
  return page
    .evaluate(() => {
      return window.editor.state.doc.toString();
    })
    .then(frmt);
}

function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}
