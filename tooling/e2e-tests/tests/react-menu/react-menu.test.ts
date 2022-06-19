import { expect, Page, test } from '@playwright/test';
import path from 'path';

import {
  ctrlKey,
  mountEditor,
  pmRoot,
  pressLeft,
  sleep,
} from '../../setup/helpers';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
});

const isMenuActive = (page: Page) =>
  page.evaluate(() => {
    const win = window as any;
    const view = win.editor.view;
    return win.commands.floatingMenu.queryIsMenuActive(win.floatMenuKey)(
      view.state,
      view.dispatch,
      view,
    );
  });

const insertSticker = (page: Page) =>
  page.evaluate(() => {
    const win = window as any;
    return win.dispatcher(win.commands.sticker.insertSticker('triceratops'));
  });

test.describe('react-menu test', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 600, height: 400 });
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  test('Shows and hides a tooltip menu when arrow keys moved in todo-list', async ({
    page,
  }) => {
    await page.type(pmRoot, '[ ] my task');

    await pressLeft(page, { withShift: true });

    expect(await isMenuActive(page)).toBe(true);

    await expect(page.locator('.bangle-tooltip')).toBeVisible();

    expect(await page.screenshot()).toMatchSnapshot();

    await pressLeft(page, { withShift: false });

    expect(await isMenuActive(page)).toBe(false);
  });

  test('menu positions correctly for NodeSelections', async ({ page }) => {
    await page.type(pmRoot, '[ ] my task');
    await insertSticker(page);
    await pressLeft(page);

    expect(await isMenuActive(page)).toBe(true);

    await expect(page.locator('.bangle-tooltip')).toBeVisible();
  });
});
