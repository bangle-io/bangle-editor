const path = require('path');
const helpers = require('../setup/helpers');
const url = `http://localhost:1234/${path.basename(__dirname)}`;

const PM_ID = helpers.pmRoot;

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
        bulletList(
          listItem(paragraph('my task'))
        )
      )
      "
    `);
    const state = await helpers.getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
        Object {
          "todoChecked": false,
        }
      `);
    expect(state).toMatchSnapshot();
  });

  it('Correct HTML', async () => {
    await page.type(PM_ID, '[ ] my task');

    expect(
      await page.evaluate(
        () => document.querySelector('[data-bangle-is-todo]').innerText,
      ),
    ).toEqual('my task');

    expect(
      await page.evaluate(
        () => document.querySelector('[data-bangle-is-todo] input').outerHTML,
      ),
    ).toMatch(/<input type="checkbox">/);
  });

  it('Clicking the task dones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-is-todo] input');

    const state = await helpers.getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
        Object {
          "todoChecked": true,
        }
      `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('[data-bangle-is-todo] input');
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === true;
      }),
    ).toBe(true);
  });

  it('Clicking a done task undones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-is-todo] input');
    await helpers.sleep(10);
    await page.click('[data-bangle-is-todo] input');

    const state = await helpers.getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
        Object {
          "todoChecked": false,
        }
      `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('[data-bangle-is-todo] input');
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === false;
      }),
    ).toBe(true);
  });

  it('Backspace a todo item', async () => {
    await page.type(PM_ID, '[ ] a');

    await helpers.sleep(10);

    await page.keyboard.press('Backspace', { delay: 10 });
    await page.keyboard.press('Backspace', { delay: 10 });

    const doc = await helpers.getDoc(page);

    expect(doc).toMatchInlineSnapshot(`
      "doc(paragraph)
      "
    `);
  });

  it('Entering a todo item', async () => {
    await page.type(PM_ID, '[ ] a');

    await helpers.sleep(10);

    await page.keyboard.press('Enter', { delay: 10 });
    let doc = await helpers.getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        bulletList(
          listItem(paragraph('a')),
          listItem(paragraph)
        )
      )
      "
    `);
    // pressing enter on empty todo list unindents
    await page.keyboard.press('Enter', { delay: 10 });
    doc = await helpers.getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        bulletList(
          listItem(paragraph('a'))
        ),
        paragraph
      )
      "
    `);
  });
});
