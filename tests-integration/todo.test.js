const URL = `http://localhost:4444`;
const PM_ID = '.ProseMirror';

const {
  mountEditor,
  getDoc,
  getEditorState,
  ctrlKey,
  sleep,
} = require('./helpers');

jest.setTimeout(25 * 1000);

describe('Todo test', () => {
  let page;
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(URL);
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });
  afterEach(async () => {
    await page.close();
  });

  it('Creates a todo task', async () => {
    await page.type(PM_ID, '[ ] my task');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        todo_list(
          todo_item(paragraph('my task'))
        )
      )
      "
    `);
    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "class": "flex",
        "data-done": false,
        "data-type": "todo_item",
      }
    `);
    expect(state).toMatchSnapshot();
  });

  it('Correct HTML', async () => {
    await page.type(PM_ID, '[ ] my task');

    expect(
      await page.evaluate(
        () => document.querySelector('[data-type="todo_item"]').innerText,
      ),
    ).toEqual('my task');

    expect(
      await page.evaluate(
        () => document.querySelector('.todo-checkbox input').outerHTML,
      ),
    ).toMatch(
      /<input class="inline-block" type="checkbox" id="todo_item[\d]+" name="todo_item[\d]+/,
    );
  });

  it('Clicking the task dones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('.todo-checkbox input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "class": "flex",
        "data-done": true,
        "data-type": "todo_item",
      }
    `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('.todo-checkbox input');
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === true;
      }),
    ).toBe(true);
  });

  it('Clicking a done task undones it', async () => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('.todo-checkbox input');
    await sleep(10);
    await page.click('.todo-checkbox input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toMatchInlineSnapshot(`
      Object {
        "class": "flex",
        "data-done": false,
        "data-type": "todo_item",
      }
    `);
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('.todo-checkbox input');
        if (!el) {
          throw new Error('Input not found');
        }
        return el.checked === false;
      }),
    ).toBe(true);
  });
});
