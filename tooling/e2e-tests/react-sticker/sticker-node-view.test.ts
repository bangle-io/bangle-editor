import path from 'path';

import { expect, Page, test } from '@playwright/test';
import {
  pmRoot,
  ctrlKey,
  mountEditor,
  pressLeft,
  sleep,
  getEditorState,
  pressRight,
} from '../setup/helpers';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  await mountEditor(page);
});

const insertSticker = (page: Page) =>
  page.evaluate(() => {
    const win = window as any;
    return win.dispatcher(win.commands.sticker.insertSticker('triceratops'));
  });

test('Creates a sticker correctly', async ({ page }) => {
  await insertSticker(page);

  expect(await getEditorState(page)).toEqual({
    doc: {
      content: [
        {
          content: [
            {
              attrs: {
                'data-bangle-name': 'sticker',
                'data-stickerkind': 'triceratops',
              },
              type: 'sticker',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    selection: {
      anchor: 2,
      head: 2,
      type: 'text',
    },
  });
});

test('select sticker via key left', async ({ page }) => {
  await insertSticker(page);
  await pressLeft(page);
  const state = await getEditorState(page);
  expect(state.selection).toEqual({
    anchor: 1,
    type: 'node',
  });
});

test('typing on selected sticker replaces it', async ({ page }) => {
  await insertSticker(page);
  await pressLeft(page);
  let state = await getEditorState(page);
  expect(state.selection).toEqual({
    anchor: 1,
    type: 'node',
  });
  await page.keyboard.type('hello', { delay: 10 });

  state = await getEditorState(page);
  expect(state.doc.content).toEqual([
    {
      content: [
        {
          text: 'hello',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
  ]);
});

test('typing before and after sticker', async ({ page }) => {
  await insertSticker(page);
  await pressLeft(page);
  await pressLeft(page);

  await page.keyboard.type('before', { delay: 10 });

  await pressRight(page);
  await pressRight(page);
  await page.keyboard.type('after', { delay: 10 });

  let state = await getEditorState(page);
  expect(state.doc.content).toEqual([
    {
      content: [
        {
          text: 'before',
          type: 'text',
        },
        {
          attrs: {
            'data-bangle-name': 'sticker',
            'data-stickerkind': 'triceratops',
          },
          type: 'sticker',
        },
        {
          text: 'after',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
  ]);
});

test('clicking on sticker should select it', async ({ page }) => {
  await insertSticker(page);
  let state = await getEditorState(page);

  expect(state.selection).toEqual({
    anchor: 2,
    head: 2,
    type: 'text',
  });
  const sticker = await page.$('.bangle-sticker');
  expect(sticker).toBeTruthy();
  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeFalsy();

  await page.click('.bangle-sticker');

  state = await getEditorState(page);
  expect(state.selection).toEqual({
    anchor: 1,
    type: 'node',
  });

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeTruthy();
});

test('sticker should lose selection when arrow right', async ({ page }) => {
  await insertSticker(page);
  let state = await getEditorState(page);

  expect(state.selection).toEqual({
    anchor: 2,
    head: 2,
    type: 'text',
  });

  await page.click('.bangle-sticker');

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeTruthy();

  await pressLeft(page);

  expect(await page.$('.bangle-sticker > .bangle-selected')).toBeFalsy();
});

test('copy pasting sticker should work', async ({ page }) => {
  await insertSticker(page);
  let state = await getEditorState(page);

  expect(state.selection).toEqual({
    anchor: 2,
    head: 2,
    type: 'text',
  });

  await page.evaluate(() => {
    const win = window as any;
    const { dom } = win.__serializeForClipboard(
      win.editor.view,
      win.editor.view.state.doc.slice(1, 2),
    );
    let pasteString = dom.innerHTML;
    let str = `<meta charset="utf-8">${pasteString}`;
    win.manualPaste(str);
  });

  expect(await page.screenshot()).toMatchSnapshot();

  expect(await getEditorState(page)).toEqual({
    doc: {
      content: [
        {
          content: [
            {
              attrs: {
                'data-bangle-name': 'sticker',
                'data-stickerkind': 'triceratops',
              },
              type: 'sticker',
            },
            {
              attrs: {
                'data-bangle-name': 'sticker',
                'data-stickerkind': 'triceratops',
              },
              type: 'sticker',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'doc',
    },
    selection: {
      anchor: 3,
      head: 3,
      type: 'text',
    },
  });
});
