const path = require('path');
const {
  ctrlKey,
  getEditorState,
  mountEditor,
  pmRoot,
} = require('../setup/helpers');
const url = `http://localhost:1234/${path.basename(__dirname)}`;

jest.setTimeout(25 * 1000);

describe('Title load test', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();
    page.on('error', (err) => {
      console.log('error happen at the page: ', err);
    });

    page.on('pageerror', (pageerr) => {
      console.log('pageerror occurred: ', pageerr);
    });
    await page.goto(url);
  });

  it('should be titled correctly', async () => {
    await expect(page.title()).resolves.toMatch('Bangle App');
  });
});

describe('Basic typing', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();
    // page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    await page.goto(url);

    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a', { delay: 70 });
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 70 });
  });

  it('should type sentence correctly', async () => {
    await page.type(pmRoot, 'World', { delay: 70 });
    const editorState = await getEditorState(page);
    expect(editorState.doc.content[0].content).toEqual([
      {
        text: 'World',
        type: 'text',
      },
    ]);
    expect(editorState).toMatchSnapshot();
  });

  it('should type  new line correctly', async () => {
    await page.type(pmRoot, 'Hello!', { delay: 70 });
    await page.keyboard.press('Enter');
    const editorState = await getEditorState(page);

    expect(editorState.doc.content.length).toBe(2);
    expect(editorState.doc.content[0].content).toEqual([
      {
        text: 'Hello!',
        type: 'text',
      },
    ]);
    expect(editorState).toMatchSnapshot();
  });

  it('should delete text correctly', async () => {
    await page.type(pmRoot, 'My name is kj');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace');
    await page.keyboard.press('Backspace', { delay: 70 });
    const editorState = await getEditorState(page);
    expect(editorState.doc.content.length).toBe(1);
    expect(editorState.doc.content[0].content).toEqual([
      {
        text: 'My name is ',
        type: 'text',
      },
    ]);
    expect(editorState).toMatchSnapshot();
  });
});
