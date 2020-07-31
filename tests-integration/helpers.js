const ctrlKey = process.env.CI ? 'Control' : 'Meta';

module.exports = {
  mountEditor,
  getEditorState,
  ctrlKey,
};

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
