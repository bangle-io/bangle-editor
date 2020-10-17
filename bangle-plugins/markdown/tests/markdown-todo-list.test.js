/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';
import fs from 'fs/promises';
import path from 'path';

describe('todo list', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>
              first
              <link href="https://example.com">https://example.com</link>
            </para>
          </todoItem>
          <todoItem data-done={true}>
            <para>[]second</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem data-done={false}>
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

      - [ ] second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>[]second</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
            <ol>
              <li>
                <para>[]second</para>
              </li>
            </ol>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- [ ] first

        1. second"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders with nested ordered list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
            <todoList>
              <todoItem>
                <para>[]second</para>
              </todoItem>
            </todoList>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
            <para>second</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
            <para>second</para>
          </todoItem>
        </todoList>
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
  test('homogenizes to a todo list if it sees a bullet list ', async () => {
    // - second`;
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>second</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  test('homogenizes to a todo list if it sees a bullet list ', async () => {
    // - second`;
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
        <todoList>
          <todoItem>
            <para>third</para>
          </todoItem>
        </todoList>
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
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem>
            <para>second</para>
          </todoItem>
          <todoItem>
            <para>third</para>
          </todoItem>
        </todoList>
      </doc>,
    );
  });

  test('works with nested  bullet list ', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
          </todoItem>
          <todoItem>
            <para>parent</para>
            <ul>
              <li>
                <para>first</para>
              </li>
              <li>
                <para>second</para>
              </li>
            </ul>
          </todoItem>
        </todoList>
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

  test('works with nested  bullet list ', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>top</para>
          </todoItem>
          <todoItem>
            <para>parent</para>
            <todoList>
              <todoItem>
                <para>top</para>
              </todoItem>
              <todoItem>
                <para>parent</para>
                <ul>
                  <li>
                    <para>first</para>
                  </li>
                  <li>
                    <para>second</para>
                  </li>
                </ul>
              </todoItem>
            </todoList>
          </todoItem>
          <todoItem>
            <para>bottom</para>
          </todoItem>
        </todoList>
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
  test('todo1.md: an incorrectly indented doc results in empyt list', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo1.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(md2.trim()).toEqual('- [ ]');
    expect(doc).toMatchSnapshot();
  });

  test('todo2.md: correct indentation of todo1', async () => {
    const md = await fs.readFile(
      path.join(__dirname, './fixtures/todo2.md'),
      'utf-8',
    );
    const doc = await parse(md);
    const md2 = await serialize(doc);
    expect(doc).toEqual(await parse(md2));
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
      `"doc(heading(\\"Test 1\\"), ordered_list(list_item(paragraph(\\"bar\\")), list_item(paragraph(\\"spam\\"))), heading(\\"Test 2\\"), bullet_list(list_item(paragraph)))"`,
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
