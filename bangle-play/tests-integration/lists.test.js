const PM_ID = '.ProseMirror';

const { mountEditor, getDoc, ctrlKey, uniqDatabaseUrl } = require('./helpers');

jest.setTimeout(25 * 1000);

describe('Basic typing', () => {
  let page;
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(uniqDatabaseUrl());
    await mountEditor(page);
    await page.keyboard.down(ctrlKey);
    await page.keyboard.press('a');
    await page.keyboard.up(ctrlKey);
    await page.keyboard.press('Backspace', { delay: 10 });
  });
  afterEach(async () => {
    await page.close();
  });

  it('should expand into an unordered list', async () => {
    await page.type(PM_ID, '- First');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        bullet_list(
          list_item(paragraph('First'))
        ),
        paragraph
      )
      "
    `);
  });

  it('should expand into an ordered list', async () => {
    await page.type(PM_ID, '1. First');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        ordered_list(
          list_item(paragraph('First'))
        ),
        paragraph
      )
      "
    `);
  });

  it('nests correctly list', async () => {
    await page.type(PM_ID, '- First');
    await page.keyboard.press('Enter');
    await page.type(PM_ID, 'Second');
    await page.keyboard.press('Tab');
    const doc = await getDoc(page);
    expect(doc).toMatchInlineSnapshot(`
      "doc(
        bullet_list(
          list_item(
            paragraph('First'),
            bullet_list(
              list_item(
                paragraph('Second')
              )
            )
          )
        ),
        paragraph
      )
      "
    `);
  });
});
