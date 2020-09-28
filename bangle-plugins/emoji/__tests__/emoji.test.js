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
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import EmojiExtension from '../index';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new EmojiExtension(),
];
const testEditor = renderTestEditor({ extensions });

test('Rendering works', async () => {
  Date.now = jest.fn(() => 0);
  const { container, editor } = await testEditor(
    <doc>
      <para>
        foo[]bar
        <emoji data-emojikind=":horse:" />
      </para>
    </doc>,
  );

  expect(editor.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <emoji data-emojikind=":horse:" />
      </para>
    </doc>,
  );
  expect(container.querySelector(`[data-type="emoji"]`)).toMatchSnapshot();
});

describe('markdown', () => {
  let schemaPromise;
  const serialize = async (doc) => {
    const content = doc(await schemaPromise);
    return markdownSerializer(await schemaPromise).serialize(content);
  };
  beforeAll(async () => {
    schemaPromise = renderTestEditor({ extensions })().then((r) => r.schema);
  });

  test('markdown serialization', async () => {
    const md = await serialize(
      <doc>
        <para>
          hello world
          <emoji data-emojikind=":horse:" />
        </para>
      </doc>,
    );
    expect(md).toMatchInlineSnapshot(
      `"hello world[$emoji](bangle://data-emojikind=%22%3Ahorse%3A%22&data-type=%22emoji%22)"`,
    );
  });
});
