import { expect, test } from '@playwright/test';
import path from 'path';

import {
  ctrlKey,
  getEditorState,
  mountEditor,
  pmRoot,
} from '../../setup/helpers';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
});

test.describe('Title load test', () => {
  test('should be titled correctly', async ({ page }) => {
    await expect(page.title()).resolves.toMatch('Bangle testing');
  });
});

test.describe('Basic typing', () => {
  test.beforeEach(async ({ page }) => {
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a', { delay: 70 });
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 70 });
  });

  test('should type sentence correctly', async ({ page }) => {
    await page.type(pmRoot, 'World', { delay: 70 });
    const editorState = await getEditorState(page);
    expect(editorState.doc.content[0].content).toEqual([
      {
        text: 'World',
        type: 'text',
      },
    ]);
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test('should type  new line correctly', async ({ page }) => {
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
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test('should delete text correctly', async ({ page }) => {
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
    expect(await page.screenshot()).toMatchSnapshot();
  });
});
