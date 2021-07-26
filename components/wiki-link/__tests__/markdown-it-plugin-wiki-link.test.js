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
import { wikiLink, wikiLinkMarkdownItPlugin } from '../index';

const specRegistry = new SpecRegistry([...defaultSpecs(), wikiLink.spec()]);
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
    getDefaultMarkdownItTokenizer().use(wikiLinkMarkdownItPlugin),
  ).parse(md);

describe('markdown', () => {
  test('basic', async () => {
    const doc = (
      <doc>
        <para>
          hello world <wikiLink path="magic/123" /> earth
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world [[magic/123]] earth"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('understands a title', async () => {
    const doc = (
      <doc>
        <para>
          hello world <wikiLink path="magic/123" title="magical" /> earth
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello world [[magic/123|magical]] earth');
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('does not print a title if its same as path', async () => {
    const doc = (
      <doc>
        <para>
          hello world <wikiLink path="magic/123" title="magic/123" /> earth
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello world [[magic/123]] earth');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello world <wikiLink path="magic/123" /> earth
        </para>
      </doc>,
    );
  });

  test('multiple wikilinks', async () => {
    const doc = (
      <doc>
        <para>
          hello world <wikiLink path="magic/123" /> earth{' '}
          <wikiLink path="mars" /> is great too
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello world [[magic/123]] earth [[mars]] is great too');
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('multiple wikilinks 2', async () => {
    const doc = (
      <doc>
        <para>
          hello world <wikiLink path="magic/123" /> earth{' '}
          <wikiLink path="mars" /> is great too
        </para>
        <para>
          hello world <wikiLink path="magic/345" /> earth{' '}
          <wikiLink path="venus" title="goddess of love and beauty" /> is great
          too
        </para>
        <ul tight={true}>
          <li>
            <para>
              hello world <wikiLink path="magic/567" /> earth{' '}
              <wikiLink path="mercury" /> is great too
            </para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "hello world [[magic/123]] earth [[mars]] is great too

      hello world [[magic/345]] earth [[venus|goddess of love and beauty]] is great too

      - hello world [[magic/567]] earth [[mercury]] is great too"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('parsing', () => {
  test('space', async () => {
    const md = `[[/Main/Wiki Link]]`;
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          <wikiLink path="/Main/Wiki Link" />
        </para>
      </doc>,
    );
  });
  test('case 1', async () => {
    const md = `[[Wiki Link]]s are cool`;
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          <wikiLink path="Wiki Link" />s are cool
        </para>
      </doc>,
    );
  });
  test('case 2', async () => {
    const md = `This is [[not a valid wiki link]`;
    // doing toString and not JSX
    // since text [[ will trip our JSX selection syntax
    // as we use [abcd] to tell test runner to select `abcd`.
    expect((await parse(md)).toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"This is [[not a valid wiki link]\\"))"`,
    );
  });
  test('case 3 chinese char', async () => {
    const md = `一段 [[链接]]。`;

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          一段 <wikiLink path="链接" />。
        </para>
      </doc>,
    );
  });
  test('case 4 no space', async () => {
    const md = `Some[[wiki-link.md]]no-space.`;

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          Some
          <wikiLink path="wiki-link.md" />
          no-space.
        </para>
      </doc>,
    );
  });

  test('weird case 1', async () => {
    const md = `Nested [[weird [ wiki link]]`;
    // doing toString and not JSX
    // since text [[ will trip our JSX selection syntax
    // as we use [abcd] to tell test runner to select `abcd`.
    expect((await parse(md)).toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"Nested [[weird [ wiki link]]\\"))"`,
    );
  });
  test('weird case 2', async () => {
    const md = `Nested [[weird [[ wiki link]]`;
    // doing toString and not JSX
    // since text [[ will trip our JSX selection syntax
    // as we use [abcd] to tell test runner to select `abcd`.
    expect((await parse(md)).toString()).toMatchInlineSnapshot(
      `"doc(paragraph(\\"Nested [[weird \\", wikiLink))"`,
    );
  });
});
