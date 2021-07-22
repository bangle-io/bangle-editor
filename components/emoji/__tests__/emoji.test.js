/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core';
import {
  defaultPlugins,
  defaultSpecs,
} from '@bangle.dev/core/test-helpers/default-components';
import {
  psx,
  renderTestEditor,
} from '@bangle.dev/core/test-helpers/test-helpers';
import {
  getDefaultMarkdownItTokenizer,
  markdownParser,
} from '@bangle.dev/markdown/markdown-parser';
import { markdownSerializer } from '@bangle.dev/markdown/markdown-serializer';
import emojiParser from 'markdown-it-emoji';
import { emoji } from '../index';

let getEmoji, testEditor, specRegistry;

beforeEach(() => {
  getEmoji = jest.fn(() => 'horse');

  specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    emoji.spec({ getEmoji }),
  ]);
  const plugins = [...defaultPlugins(), emoji.plugins()];

  testEditor = renderTestEditor({
    specRegistry,
    plugins,
  });
});

test('Rendering works', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = testEditor(
    <doc>
      <para>
        foo[]bar
        <emoji emojiAlias="horse" />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <emoji emojiAlias="horse" />
      </para>
    </doc>,
  );
  expect(getEmoji).toMatchInlineSnapshot(`
    [MockFunction] {
      "calls": Array [
        Array [
          "horse",
          Object {
            "attrs": Object {
              "emojiAlias": "horse",
            },
            "type": "emoji",
          },
        ],
      ],
      "results": Array [
        Object {
          "type": "return",
          "value": "horse",
        },
      ],
    }
  `);
  expect(
    container.querySelector(`[data-bangle-name="emoji"]`),
  ).toMatchSnapshot();
});

describe('markdown', () => {
  const serialize = async (doc) => {
    let content = doc;
    if (typeof doc === 'function') {
      content = doc(specRegistry.schema);
    }
    return markdownSerializer(specRegistry).serialize(content);
  };
  const parse = async (md) =>
    markdownParser(
      specRegistry,
      getDefaultMarkdownItTokenizer().use(emojiParser),
    ).parse(md);

  test('markdown 1', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <emoji emojiAlias="horse" />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world:horse:"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('markdown 2', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <emoji />
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world:smiley:"`);
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
