import { expect, Page, test } from '@playwright/test';
import path from 'path';

import {
  ctrlKey,
  getDoc,
  getEditorState,
  mountEditor,
  pmRoot as PM_ID,
  sleep,
} from '../../setup/helpers';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });

  await mountEditor(page);
});

test.describe('Todo test', () => {
  test.beforeEach(async ({ page }) => {
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  test('Creates a todo task', async ({ page }) => {
    await page.type(PM_ID, '[ ] my task');
    const doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  bulletList(
    listItem(paragraph('my task'))
  )
)
    `.trim(),
    );
    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toEqual({
      todoChecked: false,
    });
    expect(await page.screenshot()).toMatchSnapshot();
  });

  test('Correct HTML', async ({ page }) => {
    await page.type(PM_ID, '[ ] my task');

    await expect(page.locator('[data-bangle-is-todo]')).toContainText(
      'my task',
    );

    expect(await page.locator('[data-bangle-is-todo]').innerHTML()).toEqual(
      `
      <span contenteditable="false"><input type="checkbox"></span><span class="bangle-nv-content"><p>my task</p></span>
    `.trim(),
    );
  });

  test('Clicking the task dones it', async ({ page }) => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-is-todo] input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toEqual({
      todoChecked: true,
    });
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('[data-bangle-is-todo] input');
        if (!el) {
          throw new Error('Input not found');
        }
        if (el instanceof HTMLInputElement) {
          return el.checked === true;
        }
        return undefined;
      }),
    ).toBe(true);
  });

  test('Clicking a done task undones it', async ({ page }) => {
    await page.type(PM_ID, '[ ] my task');

    await page.click('[data-bangle-is-todo] input');
    await sleep(10);
    await page.click('[data-bangle-is-todo] input');

    const state = await getEditorState(page);
    expect(state.doc.content[0].content[0].attrs).toEqual({
      todoChecked: false,
    });
    expect(
      await page.evaluate(() => {
        const el = document.querySelector('[data-bangle-is-todo] input');
        if (!el) {
          throw new Error('Input not found');
        }
        if (el instanceof HTMLInputElement) {
          return el.checked === false;
        }
        return undefined;
      }),
    ).toBe(true);
  });

  test('Backspace a todo item', async ({ page }) => {
    await page.type(PM_ID, '[ ] a');

    await sleep(10);

    await page.keyboard.press('Backspace', { delay: 10 });
    await page.keyboard.press('Backspace', { delay: 10 });

    const doc = await getDoc(page);

    expect(doc).toEqual(`doc(paragraph)`);
  });

  test('Entering a todo item', async ({ page }) => {
    await page.type(PM_ID, '[ ] a');

    await sleep(10);

    await page.keyboard.press('Enter', { delay: 10 });
    let doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  bulletList(
    listItem(paragraph('a')),
    listItem(paragraph)
  )
)
    `.trim(),
    );
    // pressing enter on empty todo list unindents
    await page.keyboard.press('Enter', { delay: 10 });
    doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  bulletList(
    listItem(paragraph('a'))
  ),
  paragraph
)
    `.trim(),
    );
  });
});
