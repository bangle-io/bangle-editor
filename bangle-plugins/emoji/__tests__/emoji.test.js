/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor } from 'bangle-core/test-helpers/';
import {
  OrderedList,
  BulletList,
  ListItem,
  Heading,
  HardBreak,
  TodoList,
  TodoItem,
  Image,
  Blockquote,
  CodeBlock,
  HorizontalRule,
} from 'bangle-core/nodes';
import {
  getMarkdownSerializer,
  markdownSerializer,
} from 'bangle-plugins/markdown/markdown-serializer';
import EmojiExtension from '../index';
import { markdownParser } from 'bangle-plugins/markdown/markdown-parser';
import { Bold, Code, Italic, Link, Strike, Underline } from 'bangle-core/index';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
  new Heading(),
  new Underline(),
  new TodoList(),
  new TodoItem(),
  new Blockquote(),
  new CodeBlock(),
  new HorizontalRule(),
  new Image(),

  // marks
  new Link(),
  new Bold(),
  new Italic(),
  new Strike(),
  new Code(),
  new Underline(),
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

  const { nodeSerializer, markSerializer } = getMarkdownSerializer(extensions);
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(await schemaPromise);
    }
    return markdownSerializer(nodeSerializer, markSerializer).serialize(
      content,
    );
  };
  const parse = async (md) => markdownParser(await schemaPromise).parse(md);

  beforeAll(async () => {
    schemaPromise = renderTestEditor({ extensions })().then((r) => r.schema);
  });

  test('markdown', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <emoji data-emojikind="horse" />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world:horse:"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('markdown', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <emoji />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world:performing_arts:"`);
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello world
          <emoji />
        </para>
      </doc>,
    );
  });
});
