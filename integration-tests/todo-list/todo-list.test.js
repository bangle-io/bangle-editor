const path = require('path');
const helpers = require('../setup/helpers');
const url = `http://localhost:1234/${path.basename(__dirname)}`;

const PM_ID = '#pm-root';

describe('Todo test', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();

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
    await helpers.mountEditor(page);
    await page.keyboard.down(helpers.ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(helpers.ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  it('Creates a todo task', async () => {
    await page.type(PM_ID, '[ ] my task');
    const doc = await helpers.getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        todoList(
          todoItem(paragraph('my task'))
        )
      )
      "
    `);
    const state = await helpers.getEditorState(page);
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
        () => document.querySelector('[data-bangle-name="todoItem"]').innerText,
      ),
    ).toEqual('my task');

    expect(
      await page.evaluate(
        () =>
          document.querySelector('[data-bangle-name="todoItem"] input')
            .outerHTML,
      ),
    ).toMatch(/<input type="checkbox">/);
  });

  it('Clicking the task dones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-name="todoItem"] input');

    const state = await helpers.getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
        Object {
          "done": true,
        }
      `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector(
          '[data-bangle-name="todoItem"] input',
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

    await page.click('[data-bangle-name="todoItem"] input');
    await helpers.sleep(10);
    await page.click('[data-bangle-name="todoItem"] input');

    const state = await helpers.getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
        Object {
          "done": false,
        }
      `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector(
          '[data-bangle-name="todoItem"] input',
        );
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === false;
      }),
    ).toBe(true);
  });
});
