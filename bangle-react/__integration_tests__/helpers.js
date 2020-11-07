const ctrlKey = process.env.CI ? 'Control' : 'Meta';

module.exports = {
  url: `http://localhost:4002`,
  mountEditor,
  getEditorState,
  executeCopy: executeCopy,
  pressPaste,
  pressRight,
  pressLeft,
  debug,
};

async function mountEditor(page, props) {
  await page.waitForSelector('#pm-root', { timeout: 500 });
  // let the collab  settle down
}

async function getEditorState(page) {
  return page.evaluate(() => {
    return window.editor.view.state.toJSON();
  });
}

async function executeCopy() {
  await page.evaluate(() => {
    // Copy the selected content to the clipboard
    document.execCommand('copy');
    // Obtain the content of the clipboard as a string
  });
}

async function pressPaste() {
  await page.evaluate(() => {
    // Copy the selected content to the clipboard
    document.execCommand('paste');
    // Obtain the content of the clipboard as a string
  });
  // await page.keyboard.down(ctrlKey);
  // await page.keyboard.press('v');
  // await page.keyboard.up(ctrlKey);
}

async function pressRight() {
  await page.keyboard.press('ArrowRight');
}

async function pressLeft() {
  await page.keyboard.press('ArrowLeft');
}

async function debug() {
  return jestPuppeteer.debug();
}
