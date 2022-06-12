import { expect, test } from '@playwright/test';
import path from 'path';

import { ctrlKey, getDoc, mountEditor, pmRoot } from '../setup/helpers';

test.beforeEach(async ({ page, baseURL }, testInfo) => {
  const url = `${baseURL}/${path.basename(__dirname)}`;
  await page.goto(url, { waitUntil: 'networkidle' });
});

test.describe('Basic typing', () => {
  test.beforeEach(async ({ page }) => {
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  test('should expand into an unordered list', async ({ page }) => {
    await page.type(pmRoot, '- First');
    const doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  bulletList(
    listItem(paragraph('First'))
  )
)
    `.trim(),
    );
  });

  test('should expand into an ordered list', async ({ page }) => {
    await page.type(pmRoot, '1. First');
    const doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  orderedList(
    listItem(paragraph('First'))
  )
)`.trim(),
    );
  });

  test('nests correctly list', async ({ page }) => {
    await page.type(pmRoot, '- First');
    await page.keyboard.press('Enter');
    await page.type(pmRoot, 'Second');
    await page.keyboard.press('Tab');
    const doc = await getDoc(page);
    expect(doc).toEqual(
      `
doc(
  bulletList(
    listItem(
      paragraph('First'),
      bulletList(
        listItem(
          paragraph('Second')
        )
      )
    )
  )
)`.trim(),
    );
  });
});
