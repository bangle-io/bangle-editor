import prettier from 'prettier';
import os from 'os';
import { Page } from '@playwright/test';

export const pmRoot = '#pm-root';
export const ctrlKey = os.platform() === 'darwin' ? 'Meta' : 'Control';

function frmt(doc: any) {
  return prettier.format(doc.toString(), {
    semi: false,
    parser: 'babel',
    printWidth: 36,
    singleQuote: true,
  });
}

export async function mountEditor(page: Page) {
  await page.locator(pmRoot).waitFor();
  await page.locator('.ProseMirror').waitFor();
}

export async function getEditorState(page: Page) {
  return page.evaluate(() => {
    return (window as any).editor.view.state.toJSON();
  });
}

export async function pressRight(
  page: Page,
  { withShift } = { withShift: false },
) {
  if (withShift) {
    await page.keyboard.down('Shift');
  }
  await page.keyboard.press('ArrowRight');
  if (withShift) {
    await page.keyboard.up('Shift');
  }
}

export async function pressLeft(
  page: Page,
  { withShift } = { withShift: false },
) {
  if (withShift) {
    await page.keyboard.press('Shift+ArrowLeft');
  } else {
    await page.keyboard.press('ArrowLeft');
  }
}

export function sleep(t = 20) {
  return new Promise((res) => setTimeout(res, t));
}

export async function getDoc(page: Page) {
  return page
    .evaluate(() => {
      return (window as any).editor.view.state.doc.toString();
    })
    .then(frmt)
    .then((doc) => doc.trim());
}
