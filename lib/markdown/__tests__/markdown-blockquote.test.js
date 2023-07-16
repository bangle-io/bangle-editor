/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';

import { parse, serialize } from './setup';

describe('blockquote', () => {
  test('renders blockquote', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>kj</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"> kj"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('when blockquote with empty para above, parsing removes it', async () => {
    const doc = (
      <doc>
        <para></para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "
        > foobar"
      `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with empty para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with two para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>check</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  // TODO is this behaviour desired
  test('renders blockquote with two para and one empty para inside', async () => {
    const doc = (
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
          <para>check</para>
        </blockquote>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "other paragraph

      > hello
      >
      > check"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>check</para>
        </blockquote>
      </doc>,
    );
  });

  test('renders blockquote with para below', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>other paragraph</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "> hello

      other paragraph"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>other paragraph</para>
      </doc>,
    );
  });

  test('renders blockquote with hardbreak below', async () => {
    const doc = (
      <doc>
        <blockquote>
          <para>
            hello
            <br />
            world
          </para>
        </blockquote>
        <para>other paragraph</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "> hello\\
      > world

      other paragraph"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders blockquote with list', async () => {
    const doc = (
      <doc>
        <ul tight={true}>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>[]</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- top

      > hello"
    `);
    expect(await parse(md)).toEqualDocument(
      <doc>
        <ul tight={true}>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    );
  });
});
