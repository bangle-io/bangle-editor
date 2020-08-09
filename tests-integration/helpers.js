const prettier = require('prettier');

const ctrlKey = process.env.CI ? 'Control' : 'Meta';

module.exports = {
  mountEditor,
  getEditorState,
  ctrlKey,
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
  await page.waitForSelector('#bangle-play-react-editor');
  //   await page.$eval(
  //     '#editor-container',
  //     (_, props) => {
  //       window.__mountEditor(props);
  //     },
  //     props,
  //   );
  await page.waitForSelector('.ProseMirror', { timeout: 500 });
  await page.click('.ProseMirror');
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
