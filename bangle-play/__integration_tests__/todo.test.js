const {
  mountEditor,
  getDoc,
  getEditorState,
  ctrlKey,
  sleep,
  uniqDatabaseUrl,
  PM_ID,
} = require('./helpers');

jest.setTimeout(25 * 1000);

describe('Todo test', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();

    page.on('error', (err) => {
      console.log('error happen at the page: ', err);
    });

    page.on('pageerror', (pageerr) => {
      console.log('pageerror occurred: ', pageerr);
    });

    await page.goto(uniqDatabaseUrl());
    await sleep(30);
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  it('Works', async () => {
    // For some reason the first test fails, so put this dummy to fix that
    await page.keyboard.press('a');
  });

  it('Creates a todo task', async () => {
    await page.type(PM_ID, '[ ] my task');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        todo_list(
          todo_item(paragraph('my task'))
        ),
        paragraph
      )
      "
    `);
    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "done": false,
      }
    `);
    expect(state).toMatchSnapshot();
  });

  it('Correct HTML', async () => {
    await page.type(PM_ID, '[ ] my task');

    expect(
      await page.evaluate(
        () =>
          document.querySelector('[data-bangle-name="todo_item"]').innerText,
      ),
    ).toEqual('my task');

    expect(
      await page.evaluate(
        () =>
          document.querySelector('[data-bangle-name="todo_item"] input')
            .outerHTML,
      ),
    ).toMatch(/<input type="checkbox">/);
  });

  it('Clicking the task dones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-name="todo_item"] input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "done": true,
      }
    `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector(
          '[data-bangle-name="todo_item"] input',
        );
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === true;
      }),
    ).toBe(true);
  });

  it('Clicking a done task undones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-name="todo_item"] input');
    await sleep(10);
    await page.click('[data-bangle-name="todo_item"] input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "done": false,
      }
    `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector(
          '[data-bangle-name="todo_item"] input',
        );
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === false;
      }),
    ).toBe(true);
  });
});
