/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

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
  });

  test('renders done check list', async () => {
    const doc = (
      <doc>
        <todoList>
          <todoItem>
            <para>first</para>
          </todoItem>
          <todoItem data-done="true">
            <para>[]second</para>
          </todoItem>
        </todoList>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "- [ ] first
  
        - [x] second"
      `);
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
        <para>
          <br />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
        "- [ ] first
  
          second"
      `);
  });
});
