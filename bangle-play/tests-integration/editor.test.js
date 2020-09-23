// const PM_ID = '#bangle-play-react-editor1';

const {
  mountEditor,
  getEditorState,
  ctrlKey,
  EDITOR_SELECTOR,
  uniqDatabaseUrl,
} = require('./helpers');

jest.setTimeout(25 * 1000);

describe('Title load test', () => {
  beforeAll(async () => {
    await page.goto(uniqDatabaseUrl());
  });

  it('should be titled correctly', async () => {
    await expect(page.title()).resolves.toMatch('Bangle App');
  });
});

describe('Basic typing', () => {
  let page;
  beforeEach(async () => {
    page = await browser.newPage();
    // page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    await page.goto(uniqDatabaseUrl());
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a', { delay: 70 });
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 70 });
  });
  afterEach(async () => {
    await page.close();
  });

  it('should type sentence correctly', async () => {
    await page.type(EDITOR_SELECTOR, 'World', { delay: 70 });
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
    await page.type(EDITOR_SELECTOR, 'Hello!', { delay: 70 });
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
    await page.type(EDITOR_SELECTOR, 'My name is kj');
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
