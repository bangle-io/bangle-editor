const helpers = require('../setup/helpers');
jest.setTimeout(25 * 1000);

beforeEach(async () => {
  await jestPuppeteer.resetPage();

  await page.goto(helpers.url);
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

const insertDino = () =>
  page.evaluate(() => {
    return window.dispatcher(window.commands.dino.insertDino('triceratops'));
  });

test('Creates a dino correctly', async () => {
  await insertDino();

  expect(await helpers.getEditorState(page)).toMatchInlineSnapshot(`
    Object {
      "doc": Object {
        "content": Array [
          Object {
            "content": Array [
              Object {
                "attrs": Object {
                  "data-bangle-name": "dino",
                  "data-dinokind": "triceratops",
                },
                "type": "dino",
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

test('select dino via key left', async () => {
  await insertDino();
  await helpers.pressLeft();
  const state = await helpers.getEditorState(page);
  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 1,
      "type": "node",
    }
  `);
});

test('typing on selected dino replaces it', async () => {
  await insertDino();
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

test('typing before and after dino', async () => {
  await insertDino();
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
              "data-bangle-name": "dino",
              "data-dinokind": "triceratops",
            },
            "type": "dino",
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

test('clicking on dino should select it', async () => {
  await insertDino();
  let state = await helpers.getEditorState(page);

  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 2,
      "head": 2,
      "type": "text",
    }
  `);
  const dino = await page.$('.bangle-dino');
  expect(dino).toBeTruthy();
  expect(await page.$('.bangle-dino.bangle-selected')).toBeFalsy();

  await page.click('.bangle-dino');

  state = await helpers.getEditorState(page);
  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 1,
      "type": "node",
    }
  `);

  expect(await page.$('.bangle-dino.bangle-selected')).toBeTruthy();
});

test('dino should lose selection when arrow right', async () => {
  await insertDino();
  let state = await helpers.getEditorState(page);

  expect(state.selection).toMatchInlineSnapshot(`
    Object {
      "anchor": 2,
      "head": 2,
      "type": "text",
    }
  `);

  await page.click('.bangle-dino');

  expect(await page.$('.bangle-dino.bangle-selected')).toBeTruthy();

  await helpers.pressLeft();

  expect(await page.$('.bangle-dino.bangle-selected')).toBeFalsy();
});

test('copy pasting dino should work', async () => {
  await insertDino();
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
                  "data-bangle-name": "dino",
                  "data-dinokind": "triceratops",
                },
                "type": "dino",
              },
              Object {
                "attrs": Object {
                  "data-bangle-name": "dino",
                  "data-dinokind": "triceratops",
                },
                "type": "dino",
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
