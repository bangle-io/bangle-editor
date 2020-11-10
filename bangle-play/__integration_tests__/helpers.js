const os = require('os');
const prettier = require('prettier');
const { uuid } = require('bangle-core/utils/js-utils');
const PM_ID = '.ProseMirror';

const ctrlKey = os.platform() === 'darwin' ? 'Meta' : 'Control';
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
  PM_ID,
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
  await page.waitForSelector('.ProseMirror', { timeout: 1500 });
  await page.click(EDITOR_SELECTOR);
  // let the collab  settle down
}

async function getEditorState(page) {
  return page.evaluate(() => {
    return window.editor.view.state.toJSON();
  });
}

async function getDoc(page) {
  return page
    .evaluate(() => {
      return window.editor.view.state.doc.toString();
    })
    .then(frmt);
}

function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}
