const path = require('path');
const {
  pmRoot,
  ctrlKey,
  mountEditor,
  pressLeft,
  sleep,
} = require('../setup/helpers');
const url = `http://localhost:1234/${path.basename(__dirname)}`;

const isMenuActive = () =>
  page.evaluate(() => {
    const view = window.editor.view;
    return window.commands.floatingMenu.queryIsMenuActive(window.floatMenuKey)(
      view.state,
      view.dispatch,
      view,
    );
  });

const insertSticker = () =>
  page.evaluate(() => {
    return window.dispatcher(
      window.commands.sticker.insertSticker('triceratops'),
    );
  });

describe('react-menu test', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();
    await page.setViewport({ width: 600, height: 400 });
    page.on('console', (warn) => {
      console.log('warn happen at the page: ', warn);
    });
    page.on('error', (err) => {
      console.log('error happen at the page: ', err);
    });

    page.on('pageerror', (pageerr) => {
      console.log('pageerror occurred: ', pageerr);
    });

    await page.goto(url);

    page.on('error', (err) => {
      console.log('error happen at the page');
      throw err;
    });

    page.on('pageerror', (pageerr) => {
      console.log('pageerror occurred');
      throw pageerr;
    });
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  it('Shows and hides a tooltip menu when arrow keys moved in todo-list', async () => {
    await page.type(pmRoot, '[ ] my task');
    await pressLeft({ withShift: true });

    expect(await isMenuActive()).toBe(true);
    await sleep(200);
    expect(
      await page.evaluate(
        // TODO unable to get the dimensions (transform) right on CI
        // so moving to innerHTML instead of outerHTMLs
        () => document.querySelector('.bangle-tooltip').innerHTML,
      ),
    ).toMatchSnapshot();

    await pressLeft({ withShift: false });

    expect(await isMenuActive()).toBe(false);
  });

  it('menu positions correctly for NodeSelections', async () => {
    await page.type(pmRoot, '[ ] my task');
    await insertSticker();
    await pressLeft();

    expect(await isMenuActive()).toBe(true);
    await sleep(200);
    expect(
      await page.evaluate(
        () => document.querySelector('.bangle-tooltip').innerHTML,
      ),
    ).toMatchSnapshot();
  });
});
