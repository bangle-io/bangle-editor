const prettier = require('prettier');
const os = require('os');

const pmRoot = '#pm-root';
const ctrlKey = os.platform() === 'darwin' ? 'Meta' : 'Control';

module.exports = {
  mountEditor,
  getEditorState,
  pressRight,
  pressLeft,
  debug,
  ctrlKey,
  pmRoot,
  getDoc,
  sleep,
};

function frmt(doc) {
  return prettier.format(doc.toString(), {
    semi: false,
    parser: 'babel',
    printWidth: 36,
    singleQuote: true,
  });
}

async function mountEditor(page, props) {
  await page.waitForSelector(pmRoot, { timeout: 500 });
  await page.waitForSelector('.ProseMirror', { timeout: 500 });
}

async function getEditorState(page) {
  return page.evaluate(() => {
    return window.editor.view.state.toJSON();
  });
}

async function pressRight({ withShift } = {}) {
  if (withShift) {
    await page.keyboard.down('Shift');
  }
  await page.keyboard.press('ArrowRight');
  if (withShift) {
    await page.keyboard.up('Shift');
  }
}

async function pressLeft({ withShift } = {}) {
  if (withShift) {
    await page.keyboard.down('Shift');
  }
  await page.keyboard.press('ArrowLeft');
  if (withShift) {
    await page.keyboard.up('Shift');
  }
}

function debug() {
  return jestPuppeteer.debug();
}

function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

async function getDoc(page) {
  return page
    .evaluate(() => {
      return window.editor.view.state.doc.toString();
    })
    .then(frmt);
}
