import { expect, Page, test } from '@playwright/test';
import path from 'path';

import { ctrlKey, isDarwin, repeat, sleep, undo } from '../../setup/helpers';
import {
  allEditorIds,
  baseTestConfig,
  EDITOR_1,
  EDITOR_2,
  EDITOR_3,
  EditorId,
  TestConfig,
} from './common';

const EXPECT_POLL_TIMEOUT = 5000;
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

    await expect
      .poll(
        () => {
          return getEditorsInnerHTML(page);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<h1>Test testing</h1><p>test content</p>'],
        ['EDITOR_2', '<h1>Test testing</h1><p>test content</p>'],
        ['EDITOR_3', '<h1>Test testing</h1><p>test content</p>'],
        ['EDITOR_4', '<h1>Test testing</h1><p>test content</p>'],
      ]);
  });

  test('typing a lot of things', async ({ page }) => {
    test.slow();

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

    await undo(page);
    await page.keyboard.type('b');

    await expect
      .poll(
        () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
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

  test('slow broadcast', async ({ page }) => {
    const testEditors: EditorId[] = [EDITOR_1, EDITOR_2];
    const LAG_TIME = 50;
    await loadPage(page, {
      initialEditors: testEditors,
      collabSlowdown: LAG_TIME,
    });

    await expect
      .poll(
        async () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<p>hello world!</p>'],
        ['EDITOR_2', '<p>hello world!</p>'],
      ]);

    await clearEditorText(page, EDITOR_1);
    await clickEditor(page, EDITOR_1);

    await page.keyboard.type('testing content');

    // editor 2 should be lagging
    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>testing content</p>'],
      ['EDITOR_2', '<p>hello world!</p>'],
    ]);

    await expect
      .poll(() => getEditorsInnerHTML(page, testEditors), {
        timeout: EXPECT_POLL_TIMEOUT,
      })
      .toEqual([
        ['EDITOR_1', '<p>testing content</p>'],
        ['EDITOR_2', '<p>testing content</p>'],
      ]);
  });

  test('slow broadcast both clients edit simultaneously', async ({ page }) => {
    const testEditors: EditorId[] = [EDITOR_1, EDITOR_2];
    const collabSlowdown = 100;
    const editor1Locator = page.locator(`#${EDITOR_1} .ProseMirror`);
    const editor2Locator = page.locator(`#${EDITOR_2} .ProseMirror`);
    await loadPage(page, {
      initialEditors: testEditors,
      collabSlowdown: collabSlowdown,
    });

    await expect
      .poll(
        async () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<p>hello world!</p>'],
        ['EDITOR_2', '<p>hello world!</p>'],
      ]);

    await clearEditorText(page, EDITOR_1);

    // wait for both editors to be in sync
    await expect
      .poll(
        async () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<p><br class="ProseMirror-trailingBreak"></p>'],
        ['EDITOR_2', '<p><br class="ProseMirror-trailingBreak"></p>'],
      ]);

    await editor1Locator.type('one');
    await editor2Locator.type('two');

    expect(await getEditorsInnerHTML(page, testEditors)).toEqual([
      ['EDITOR_1', '<p>one</p>'],
      ['EDITOR_2', '<p>two</p>'],
    ]);
    await page.pause();
    await expect
      .poll(
        async () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<p>onetwo</p>'],
        ['EDITOR_2', '<p>onetwo</p>'],
      ]);

    await clickEditor(page, EDITOR_1);

    await undo(page);

    // should undo editor 1's changes
    await expect
      .poll(
        async () => {
          return getEditorsInnerHTML(page, testEditors);
        },
        {
          timeout: EXPECT_POLL_TIMEOUT,
        },
      )
      .toEqual([
        ['EDITOR_1', '<p>two</p>'],
        ['EDITOR_2', '<p>two</p>'],
      ]);
  });

  // test.describe.skip('Erroring', () => {
  //   test('one editor errors 500', async ({ page }) => {
  //     await loadPage(page, { collabErrorCode: 500 });
  //     await clearEditorText(page, EDITOR_1);
  //     await clickEditor(page, EDITOR_1);

  //     await page.keyboard.type('test');
  //     await sleep();

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test'],
  //       ['EDITOR_2', 'test'],
  //       ['EDITOR_3', 'test'],
  //       ['EDITOR_4', 'test'],
  //     ]);

  //     // start failing editor 2 requests
  //     await page.click(`[aria-label="reject requests ${EDITOR_2}"]`);

  //     await clickEditor(page, EDITOR_2);

  //     await page.keyboard.type('(broken)');

  //     // wait enough that the get request from editor 2 is resent
  //     // and meets an error
  //     await sleep(1000);

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test'],
  //       ['EDITOR_2', 'test(broken)'],
  //       ['EDITOR_3', 'test'],
  //       ['EDITOR_4', 'test'],
  //     ]);

  //     await clickEditor(page, EDITOR_3);

  //     await page.keyboard.type('123');
  //     await sleep();

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test123'],
  //       ['EDITOR_2', 'test(broken)'],
  //       ['EDITOR_3', 'test123'],
  //       ['EDITOR_4', 'test123'],
  //     ]);

  //     // resolve the error
  //     await page.click(`[aria-label="reject requests ${EDITOR_2}"]`);
  //     await clickEditor(page, EDITOR_2);
  //     // typing on the editor should sync all editors
  //     await page.keyboard.type('4');
  //     await sleep();

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test123(broken)4'],
  //       ['EDITOR_2', 'test123(broken)4'],
  //       ['EDITOR_3', 'test123(broken)4'],
  //       ['EDITOR_4', 'test123(broken)4'],
  //     ]);
  //   });

  //   test('editor errors 410', async ({ page }) => {
  //     await loadPage(page, { collabErrorCode: 410 });
  //     await clearEditorText(page, EDITOR_1);
  //     await clickEditor(page, EDITOR_1);

  //     await page.keyboard.type('test');
  //     await sleep();

  //     await page.pause();
  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test'],
  //       ['EDITOR_2', 'test'],
  //       ['EDITOR_3', 'test'],
  //       ['EDITOR_4', 'test'],
  //     ]);

  //     // start failing editor 2 requests
  //     await page.click(`[aria-label="reject requests ${EDITOR_2}"]`);

  //     await clickEditor(page, EDITOR_2);
  //     await sleep(1000);
  //     await page.keyboard.type('(broken)');

  //     // wait enough that the get request from editor 2 is re-sent
  //     // and meets an error
  //     await sleep(1000);

  //     // for 410 error typing should not work
  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test'],
  //       ['EDITOR_2', 'test'],
  //       ['EDITOR_3', 'test'],
  //       ['EDITOR_4', 'test'],
  //     ]);

  //     await clickEditor(page, EDITOR_3);

  //     await page.keyboard.type('123');
  //     await sleep();

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test123'],
  //       ['EDITOR_2', 'test'],
  //       ['EDITOR_3', 'test123'],
  //       ['EDITOR_4', 'test123'],
  //     ]);

  //     // resolve the error
  //     await page.click(`[aria-label="reject requests ${EDITOR_2}"]`);
  //     await clickEditor(page, EDITOR_2);
  //     await sleep();

  //     // typing on the editor should sync all editors
  //     await page.keyboard.type('4');
  //     await sleep();

  //     expect(await getEditorsInnerText(page)).toEqual([
  //       ['EDITOR_1', 'test1234'],
  //       ['EDITOR_2', 'test1234'],
  //       ['EDITOR_3', 'test1234'],
  //       ['EDITOR_4', 'test1234'],
  //     ]);
  //   });
  // });
});
