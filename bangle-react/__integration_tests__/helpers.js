const ctrlKey = process.env.CI ? 'Control' : 'Meta';

module.exports = {
  url: `http://localhost:4002`,
  mountEditor,
  getEditorState,
  pressRight,
  pressLeft,
  debug,
};

async function mountEditor(page, props) {
  await page.waitForSelector('#pm-root', { timeout: 500 });
  // page.on('error', (err) => {
  //   console.log('error happen at the page: ', err);
  // });

  // page.on('pageerror', (pageerr) => {
  //   console.log('pageerror occurred: ', pageerr);
  // });

  await page.waitForSelector('.ProseMirror', { timeout: 500 });
}

async function getEditorState(page) {
  return page.evaluate(() => {
    return window.editor.view.state.toJSON();
  });
}

async function pressRight() {
  await page.keyboard.press('ArrowRight');
}

async function pressLeft() {
  await page.keyboard.press('ArrowLeft');
}

function debug() {
  return jestPuppeteer.debug();
}
