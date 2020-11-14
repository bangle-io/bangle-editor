/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor } from 'bangle-core/test-helpers/index';
import { markdownSerializer } from 'bangle-plugins/markdown/markdown-serializer';
import {
  defaultMarkdownItTokenizer,
  markdownParser,
} from 'bangle-plugins/markdown/markdown-parser';
import emojiParser from 'markdown-it-emoji';
import { corePlugins, coreSpec } from 'bangle-core/components/index';
import { emoji } from '../index';
import { SpecSheet } from 'bangle-core/spec-sheet';

const specSheet = new SpecSheet([...coreSpec(), emoji.spec()]);
const plugins = [...corePlugins(), emoji.plugins()];

const testEditor = renderTestEditor({
  specSheet,
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
      content = doc(specSheet.schema);
    }
    return markdownSerializer(specSheet).serialize(content);
  };
  const parse = async (md) =>
    markdownParser(
      specSheet,
      defaultMarkdownItTokenizer.use(emojiParser),
    ).parse(md);

  test('markdown', async () => {
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

test.todo('Emoji inline suggestion');
