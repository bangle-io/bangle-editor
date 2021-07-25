/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';
import fs from 'fs/promises';
import path from 'path';
import { parse, serialize } from './setup';

describe('todo list', () => {
  test('renders 1', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
          </listItem>
          <listItem todoChecked={false}>
            <para>[]second</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders done check list', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>
              first
              <link href="https://example.com">https://example.com</link>
            </para>
          </listItem>
          <listItem todoChecked={true}>
            <para>[]second</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first<https://example.com>

      - [x] second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders not done check list', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
          </listItem>
          <listItem todoChecked={false}>
            <para>[]second</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders with nested ordered list', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
            <ol tight={true}>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        1. second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders with nested todo list', async () => {
    const doc = (
      <doc>
        <bulletList tight={true}>
          <listItem todoChecked={false}>
            <para>first</para>
            <bulletList tight={true}>
              <listItem todoChecked={false}>
                <para>[]second</para>
              </listItem>
            </bulletList>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first
        - [ ] second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders with multiple para', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
            <para>second</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);
  });

  test('br follows', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
            <para>second</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('parsing', () => {
  test('homogenizes to a todo list if it sees a bullet list 1', async () => {
    // - second`;
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
          </listItem>
        </bulletList>
        <ul>
          <li>
            <para>second</para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] first


      - second"
    `);

    // It converts
    expect(await parse(md)).toEqualDocument(
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>first</para>
          </listItem>
          <listItem>
            <para>second</para>
          </listItem>
        </bulletList>
      </doc>,
    );
  });

  test('homogenizes to a todo list if it sees a bullet list 2', async () => {
    const doc = (
      <doc>
        <ul>
          <li>
            <para>first</para>
          </li>
          <li>
            <para>second</para>
          </li>
        </ul>
        <bulletList>
          <listItem todoChecked={false}>
            <para>third</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- first

      - second


      - [ ] third"
    `);

    // It converts
    expect(await parse(md)).toEqualDocument(
      <doc>
        <bulletList>
          <listItem>
            <para>first</para>
          </listItem>
          <listItem>
            <para>second</para>
          </listItem>
          <listItem todoChecked={false}>
            <para>third</para>
          </listItem>
        </bulletList>
      </doc>,
    );
  });

  test('works with 2 level nested bullet list', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>top</para>
          </listItem>
          <listItem todoChecked={false}>
            <para>parent</para>
            <ul>
              <li>
                <para>first</para>
              </li>
              <li>
                <para>second</para>
              </li>
            </ul>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] top

      - [ ] parent

        - first

        - second"
    `);

    // It converts
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('works with 3 level nested bullet list', async () => {
    const doc = (
      <doc>
        <bulletList>
          <listItem todoChecked={false}>
            <para>top</para>
          </listItem>
          <listItem todoChecked={false}>
            <para>parent</para>
            <bulletList>
              <listItem todoChecked={false}>
                <para>top</para>
              </listItem>
              <listItem todoChecked={false}>
                <para>parent</para>
                <ul>
                  <li>
                    <para>first</para>
                  </li>
                  <li>
                    <para>second</para>
                  </li>
                </ul>
              </listItem>
            </bulletList>
          </listItem>
          <listItem todoChecked={false}>
            <para>bottom</para>
          </listItem>
        </bulletList>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "- [ ] top

      - [ ] parent

        - [ ] top

        - [ ] parent

          - first

          - second

      - [ ] bottom"
    `);

    // It converts
    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('Markdown todo parsing', () => {
  test('empty list', async () => {
    const md = `
- [ ] first
-
`;
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(md2.trim()).toMatchInlineSnapshot(`
      "- [ ] first
      -"
    `);
    expect(doc).toMatchSnapshot();
  });

  test('todo1.md: an incorrectly indented doc results in empty list', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo1.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(md2.trim()).toEqual('-');
    expect(doc).toMatchSnapshot();
  });

  test('todo2.md: correct indentation of todo1', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo2.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    const res = await parse(md2);

    expect(doc.eq(res)).toBe(true);
    expect(md2.trim()).toEqual(md.trim());
    expect(doc).toMatchSnapshot();
  });

  test('todo3.md: malformed with multiple confused square braces', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo3.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
    expect(md2.trim()).toMatchSnapshot();
    expect(doc).toMatchSnapshot();
  });

  test('todo4.md multiple nesting', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo4.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
    expect(md2.trim()).toMatchSnapshot();
    expect(doc).toMatchSnapshot();
  });

  test('todo5.md no nesting', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo5.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
    expect(md2.trim()).toMatchSnapshot();
    expect(doc).toMatchSnapshot();
  });

  // TODO fix me, decide on what to do when todo is a child
  // For now I am allowing them to delete, but I gravitating more
  // towards allowing them to do whatever, i.e. make todo an attribute
  // on a list
  test('todo6.md todo a child of ordered and unordered', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo6.md'),
      'utf-8',
    );
    const doc = await parse(md);
    expect(doc.toString()).toMatchInlineSnapshot(
      `"doc(heading(\\"Test 1\\"), orderedList(listItem(paragraph(\\"foo\\"), bulletList(listItem(paragraph(\\"nested unchecked item 1\\")), listItem(paragraph(\\"not a todo item 2\\")), listItem(paragraph(\\"not a todo item 3\\")), listItem(paragraph(\\"nested checked item 4\\")))), listItem(paragraph(\\"bar\\")), listItem(paragraph(\\"spam\\"))), heading(\\"Test 2\\"), bulletList(listItem(paragraph(\\"foo\\"), bulletList(listItem(paragraph(\\"nested unchecked item 1\\")), listItem(paragraph(\\"nested unchecked item 2\\")), listItem(paragraph(\\"nested checked item 3\\")), listItem(paragraph(\\"nested checked item 4\\"))))))"`,
    );
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
    expect(md2.trim()).toMatchSnapshot();
    expect(doc).toMatchSnapshot();
  });

  test('todo7.md todo a child of ordered and unordered', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo7.md'),
      'utf-8',
    );
    const doc = await parse(md);
    expect(doc).toMatchSnapshot();
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
    expect(md2.trim()).toMatchSnapshot();
    expect(doc).toMatchSnapshot();
  });
});
