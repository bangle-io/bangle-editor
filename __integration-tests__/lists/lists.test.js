const path = require('path');
const { ctrlKey, getDoc, pmRoot, mountEditor } = require('../setup/helpers');
const url = `http://localhost:1234/${path.basename(__dirname)}`;

jest.setTimeout(25 * 1000);

describe('Basic typing', () => {
  beforeEach(async () => {
    await jestPuppeteer.resetPage();
    page.on('error', (err) => {
      console.log('error happen at the page: ', err);
    });

    page.on('pageerror', (pageerr) => {
      console.log('pageerror occurred: ', pageerr);
    });
    await page.goto(url);
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });

  it('should expand into an unordered list', async () => {
    await page.type(pmRoot, '- First');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        bulletList(
          listItem(paragraph('First'))
        )
      )
      "
    `);
  });

  it('should expand into an ordered list', async () => {
    await page.type(pmRoot, '1. First');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        orderedList(
          listItem(paragraph('First'))
        )
      )
      "
    `);
  });

  it('nests correctly list', async () => {
    await page.type(pmRoot, '- First');
    await page.keyboard.press('Enter');
    await page.type(pmRoot, 'Second');
    await page.keyboard.press('Tab');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
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
      )
      "
    `);
  });
});
