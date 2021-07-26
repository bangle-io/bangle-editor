/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core';
import { defaultPlugins, defaultSpecs } from '@bangle.dev/all-base-components';
import { psx } from '@bangle.dev/test-helpers';
import { markdownSerializer } from '@bangle.dev/markdown';
import {
  getDefaultMarkdownItTokenizer,
  markdownParser,
} from '@bangle.dev/markdown/markdown-parser';
import { markdownFrontMatter } from '../index';
import { frontMatterPlugin } from '../markdown-it-plugin';

const specRegistry = new SpecRegistry([
  ...defaultSpecs({
    doc: { content: 'markdownFrontMatter? block+' },
  }),
  markdownFrontMatter.spec(),
]);
const plugins = [...defaultPlugins()];
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
    getDefaultMarkdownItTokenizer().use(frontMatterPlugin),
  ).parse(md);

describe('markdown', () => {
  test('empty frontmatter', async () => {
    const doc = (
      <doc>
        <markdownFrontMatter />
        <para>hello world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "---

      ---

      hello world"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('frontmatter with data', async () => {
    const doc = (
      <doc>
        <markdownFrontMatter data="I am data" />
        <para>hello world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "---
      I am data
      ---

      hello world"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('frontmatter with data 2', async () => {
    const doc = (
      <doc>
        <markdownFrontMatter data={`I am data\nI am data\nI am data`} />
        <para>hello world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "---
      I am data
      I am data
      I am data
      ---

      hello world"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('frontmatter with data handles empty new lines 1', async () => {
    const doc = (
      <doc>
        <markdownFrontMatter data={`I am data\n\nI am data`} />
        <para>hello world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "---
      I am data

      I am data
      ---

      hello world"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('frontmatter with data handles empty new lines 2', async () => {
    const doc = (
      <doc>
        <markdownFrontMatter data={`I am data\nI am data\n`} />
        <para>hello world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "---
      I am data
      I am data

      ---

      hello world"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('Throws error if frontMatter not at top', async () => {
    const doc = (
      <doc>
        <para>hello world</para>
        <markdownFrontMatter data={`I am data`} />
      </doc>
    );
    await expect(
      async () => await serialize(doc),
    ).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Invalid content for node doc"`,
    );
  });
});
