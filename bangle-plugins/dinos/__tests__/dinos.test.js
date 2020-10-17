/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { fireEvent, wait } from '@testing-library/react';
import { psx, sendKeyToPm, renderTestEditor } from 'bangle-core/test-helpers/';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
} from 'bangle-core/nodes';
import Dino from '../index';
import {
  markdownParser,
  markdownSerializer,
} from 'bangle-plugins/markdown/index';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new Dino(),
];
const testEditor = renderTestEditor({ extensions });

test('Rendering works', async () => {
  Date.now = jest.fn(() => 0);
  const { container, editor } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <dino />
      </para>
    </doc>,
  );

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <dino />
      </para>
    </doc>,
  );
  expect(container.querySelector(`[data-type="dino"]`)).toMatchSnapshot();
});

test('Rendering works with different type of dino', async () => {
  Date.now = jest.fn(() => 0);
  const { container, editor } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <dino data-dinokind="stegosaurus" />
      </para>
    </doc>,
  );

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <dino data-dinokind="stegosaurus" />
      </para>
    </doc>,
  );
  expect(container.querySelector(`[data-type="dino"]`)).toMatchSnapshot();
});

describe('markdown', () => {
  let schemaPromise;
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(await schemaPromise);
    }
    return markdownSerializer(extensions).serialize(content);
  };

  const parse = async (md) =>
    markdownParser(extensions, await schemaPromise).parse(md);

  beforeAll(async () => {
    schemaPromise = renderTestEditor({ extensions })().then((r) => r.schema);
  });

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <dino data-dinokind="stegosaurus" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(
      `"hello world[$dino](bangle://data-dinokind=%22stegosaurus%22&data-type=%22dino%22)"`,
    );
  });
});
