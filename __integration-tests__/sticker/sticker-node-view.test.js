const path = require('path');
const helpers = require('../setup/helpers');
jest.setTimeout(25 * 1000);
const url = `http://localhost:1234/${path.basename(__dirname)}`;

beforeEach(async () => {
  await jestPuppeteer.resetPage();

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
});

const insertSticker = () =>
  page.evaluate(() => {
    return window.dispatcher(
      window.commands.sticker.insertSticker('triceratops'),
    );
  });

test('Creates a sticker correctly', async () => {
  await insertSticker();

  expect(await helpers.getEditorState(page)).toMatchInlineSnapshot(`
    Object {
      "doc": Object {
        "content": Array [
          Object {
            "content": Array [
              Object {
                "attrs": Object {
                  "data-bangle-name": "sticker",
                  "data-stickerkind": "triceratops",
                },
                "type": "sticker",
              },
            ],
            "type": "paragraph",
          },
        ],
        "type": "doc",
      },
      "selection": Object {
        "anchor": 2,
        "head": 2,
        "type": "text",
      },
    }
  `);
});

test('select sticker via key left', async () => {
  await insertSticker();
  await helpers.pressLeft();
  const state = await helpers.getEditorState(page);
  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 1,
      "type": "node",
    }
  `);
});

test('typing on selected sticker replaces it', async () => {
  await insertSticker();
  await helpers.pressLeft();
  let state = await helpers.getEditorState(page);
  expect(state.selection).toMatchInlineSnapshot(`
      Object {
        "anchor": 1,
        "type": "node",
      }
    `);
  await page.keyboard.type('hello', { delay: 10 });

  state = await helpers.getEditorState(page);
  expect(state.doc.content).toMatchInlineSnapshot(`
    Array [
      Object {
        "content": Array [
          Object {
            "text": "hello",
            "type": "text",
          },
        ],
        "type": "paragraph",
      },
    ]
  `);
});

test('typing before and after sticker', async () => {
  await insertSticker();
  await helpers.pressLeft();
  await helpers.pressLeft();

  await page.keyboard.type('before', { delay: 10 });

  await helpers.pressRight();
  await helpers.pressRight();
  await page.keyboard.type('after', { delay: 10 });

  let state = await helpers.getEditorState(page);
  expect(state.doc.content).toMatchInlineSnapshot(`
    Array [
      Object {
        "content": Array [
          Object {
            "text": "before",
            "type": "text",
          },
          Object {
            "attrs": Object {
              "data-bangle-name": "sticker",
              "data-stickerkind": "triceratops",
            },
            "type": "sticker",
          },
          Object {
            "text": "after",
            "type": "text",
          },
        ],
        "type": "paragraph",
      },
    ]
  `);
});

test('clicking on sticker should select it', async () => {
  await insertSticker();
  let state = await helpers.getEditorState(page);

  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 2,
      "head": 2,
      "type": "text",
    }
  `);
  const sticker = await page.$('.bangle-sticker');
  expect(sticker).toBeTruthy();
  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeFalsy();

  await page.click('.bangle-sticker');

  state = await helpers.getEditorState(page);
  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 1,
      "type": "node",
    }
  `);

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeTruthy();
});

test('sticker should lose selection when arrow right', async () => {
  await insertSticker();
  let state = await helpers.getEditorState(page);

  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 2,
      "head": 2,
      "type": "text",
    }
  `);

  await page.click('.bangle-sticker');

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeTruthy();

  await helpers.pressLeft();

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeFalsy();
});

test('copy pasting sticker should work', async () => {
  await insertSticker();
  let state = await helpers.getEditorState(page);

  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 2,
      "head": 2,
      "type": "text",
    }
  `);

  await page.evaluate(() => {
    const { dom } = window.prosemirrorView.__serializeForClipboard(
      window.editor.view,
      window.editor.view.state.doc.slice(1, 2),
    );
    let pasteString = dom.innerHTML;
    let str = `<meta charset="utf-8">${pasteString}`;
    window.manualPaste(str);
  });

  expect(await helpers.getEditorState(page)).toMatchInlineSnapshot(`
    Object {
      "doc": Object {
        "content": Array [
          Object {
            "content": Array [
              Object {
                "attrs": Object {
                  "data-bangle-name": "sticker",
                  "data-stickerkind": "triceratops",
                },
                "type": "sticker",
              },
              Object {
                "attrs": Object {
                  "data-bangle-name": "sticker",
                  "data-stickerkind": "triceratops",
                },
                "type": "sticker",
              },
            ],
            "type": "paragraph",
          },
        ],
        "type": "doc",
      },
      "selection": Object {
        "anchor": 3,
        "head": 3,
        "type": "text",
      },
    }
  `);
});
