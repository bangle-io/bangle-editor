/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import emojiParser from 'markdown-it-emoji';

import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { SpecRegistry } from '@bangle.dev/core';
import {
  getDefaultMarkdownItTokenizer,
  markdownParser,
  markdownSerializer,
} from '@bangle.dev/markdown';
import { psx, renderTestEditor } from '@bangle.dev/test-helpers';

import { emoji } from '../src/index';

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
      "calls": [
        [
          "horse",
          {
            "attrs": {
              "emojiAlias": "horse",
            },
            "type": "emoji",
          },
        ],
      ],
      "results": [
        {
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
