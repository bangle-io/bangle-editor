import { expect, Page, test } from '@playwright/test';
import path from 'path';

import { ctrlKey, isDarwin, repeat, sleep } from '../../setup/helpers';
import {
  allEditorIds,
  baseTestConfig,
  EDITOR_1,
  EDITOR_2,
  EditorId,
  TestConfig,
} from './common';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
});

const getEditorsInnerText = async (
  page: Page,
  editorIds: EditorId[] = allEditorIds,
) => {
  const result = await Promise.all(
    editorIds.map(async (id) => {
      let elHandle = await page.$(`#${id} .ProseMirror`);
      return [id, (await elHandle?.innerText())?.trim()];
    }),
  );

  return result;
};

const getEditorsInnerHTML = async (
  page: Page,
  editorIds: EditorId[] = allEditorIds,
) => {
  return Promise.all(
    editorIds.map(async (id) => {
      let elHandle = await page.$(`#${id} .ProseMirror`);
      return [id, (await elHandle?.innerHTML())?.trim()];
    }),
  );
};

const clearEditorText = async (page: Page, editorId: EditorId) => {
  await clickEditor(page, editorId);
  await page.keyboard.down(ctrlKey);
  await page.keyboard.press('a');
  await page.keyboard.up(ctrlKey);
  await page.keyboard.press('Backspace', { delay: 10 });
};

const clickEditor = async (page: Page, editorId: EditorId) => {
  await page.locator(`#${editorId} .ProseMirror`).click();
};

const closeEditor = async (page: Page, editorId: EditorId) => {
  await page.locator(`[aria-label="close ${editorId}"]`).click();
};
const mountEditor = async (page: Page, editorId: EditorId) => {
  await page.locator(`[aria-label="mount ${editorId}"]`).click();
};

const loadPage = async (page: Page, testConfig: Partial<TestConfig> = {}) => {
  let finalTestConfig: TestConfig = Object.assign(
    {},
    baseTestConfig,
    testConfig,
  );

  await page.evaluate(
    ([finalTestConfig]) => {
      const win = window as any;
      if (finalTestConfig) {
        win.testConfig = JSON.parse(finalTestConfig);
      }
      win.loadCollabComponent();
    },
    [JSON.stringify(finalTestConfig)],
  );

  await page.locator(`#${finalTestConfig.initialEditors[0]!}`).waitFor();

  return finalTestConfig;
};

test.describe('Editors should sync', () => {
  test('clearing editor', async ({ page }) => {
    await loadPage(page);

    await clickEditor(page, EDITOR_1);

    expect(await getEditorsInnerText(page)).toEqual([
      ['EDITOR_1', 'hello world!'],
      ['EDITOR_2', 'hello world!'],
      ['EDITOR_3', 'hello world!'],
      ['EDITOR_4', 'hello world!'],
    ]);

    await clearEditorText(page, EDITOR_1);

    expect(await getEditorsInnerText(page)).toEqual([
      ['EDITOR_1', ''],
      ['EDITOR_2', ''],
      ['EDITOR_3', ''],
      ['EDITOR_4', ''],
    ]);
  });

  test('typing in one editor', async ({ page }) => {
    await loadPage(page);

    await clearEditorText(page, EDITOR_1);

    await clickEditor(page, EDITOR_1);
    await page.keyboard.type('# Test testing');
    await page.keyboard.press('Enter', { delay: 10 });
    await page.keyboard.type('test content');
    await sleep();

    expect(await getEditorsInnerHTML(page)).toEqual([
      ['EDITOR_1', '<h1>Test testing</h1><p>test content</p>'],
      ['EDITOR_2', '<h1>Test testing</h1><p>test content</p>'],
      ['EDITOR_3', '<h1>Test testing</h1><p>test content</p>'],
      ['EDITOR_4', '<h1>Test testing</h1><p>test content</p>'],
    ]);
  });

  test('typing a lot of things', async ({ page }) => {
    await loadPage(page);

    await clearEditorText(page, EDITOR_1);

    await clickEditor(page, EDITOR_1);
    for (let i = 0; i < 100; i++) {
      await page.keyboard.type('test content', { delay: 1 });
      await page.keyboard.press('Enter', { delay: 5 });
    }
    await sleep(100);

    const result =
      repeat(`<p>test content</p>`, 100) +
      `<p><br class="ProseMirror-trailingBreak"></p>`;

    expect(await getEditorsInnerHTML(page)).toEqual([
      ['EDITOR_1', result],
      ['EDITOR_2', result],
      ['EDITOR_3', result],
      ['EDITOR_4', result],
    ]);
  });

  test('closing and mounting an editor should load the existing state', async ({
    page,
  }) => {
    const testEditors: EditorId[] = [EDITOR_1, EDITOR_2];
    await loadPage(page, { initialEditors: testEditors });
    await clearEditorText(page, EDITOR_1);

    await clickEditor(page, EDITOR_1);

    await page.keyboard.type('test content');

    await closeEditor(page, EDITOR_1);

    await sleep();

    await mountEditor(page, EDITOR_1);

    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>test content</p>'],
      ['EDITOR_2', '<p>test content</p>'],
    ]);
  });

  test('undo should work', async ({ page }) => {
    const testEditors: EditorId[] = [EDITOR_1, EDITOR_2];
    await loadPage(page, { initialEditors: testEditors });
    await clearEditorText(page, EDITOR_1);

    await clickEditor(page, EDITOR_1);

    await page.keyboard.type('a');

    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>a</p>'],
      ['EDITOR_2', '<p>a</p>'],
    ]);

    if (isDarwin) {
      await page.keyboard.press(`Meta+Z`);
    } else {
      await page.keyboard.down(`Control`);
      await page.keyboard.press('z');
      await page.keyboard.up(`Control`);
    }
    await page.keyboard.type('b');

    await sleep();

    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>b</p>'],
      ['EDITOR_2', '<p>b</p>'],
    ]);
  });

  test('one editor typing at start other at end', async ({ page }) => {
    const testEditors: EditorId[] = [EDITOR_1, EDITOR_2];
    await loadPage(page, { initialEditors: testEditors });
    await clearEditorText(page, EDITOR_1);
    await clickEditor(page, EDITOR_1);

    await page.keyboard.type('o');
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.type('A');

    await clickEditor(page, EDITOR_2);

    await page.keyboard.press('ArrowRight');
    await page.keyboard.type('Z');

    await sleep();

    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>AoZ</p>'],
      ['EDITOR_2', '<p>AoZ</p>'],
    ]);
  });
});
