/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor } from '@banglejs/core/test-helpers/index';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import {
  defaultMarkdownItTokenizer,
  markdownParser,
} from 'bangle-plugins/markdown/markdown-parser';
import emojiParser from 'markdown-it-emoji';
import {
  defaultPlugins,
  defaultSpecs,
} from '@banglejs/core/test-helpers/default-components';
import { emoji } from '../index';
import { SpecRegistry } from '@banglejs/core/spec-registry';

const specRegistry = new SpecRegistry([...defaultSpecs(), emoji.spec()]);
const plugins = [...defaultPlugins(), emoji.plugins()];

const testEditor = renderTestEditor({
  specRegistry,
  plugins,
});

test('Rendering works', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = testEditor(
    <doc>
      <para>
        foo[]bar
        <emoji emojiKind="horse" />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <emoji emojiKind="horse" />
      </para>
    </doc>,
  );
  expect(
    container.querySelector(`[data-bangle-name="emoji"]`),
  ).toMatchSnapshot();
});

test('Unknown emoji puts question mark', async () => {
  Date.now = jest.fn(() => 0);
  const { container, view } = testEditor(
    <doc>
      <para>
        foo[]bar
        <emoji emojiKind="unknown_emoji" />
      </para>
    </doc>,
  );

  expect(view.state).toEqualDocAndSelection(
    <doc>
      <para>
        foo[]bar
        <emoji emojiKind="unknown_emoji" />
      </para>
    </doc>,
  );
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
      defaultMarkdownItTokenizer.use(emojiParser),
    ).parse(md);

  test('markdown 1', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <emoji emojiKind="horse" />
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

test.todo('Emoji inline suggestion');
