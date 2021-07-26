/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';
import { parse, serialize } from './setup';

describe('horizontal rule', () => {
  test('renders 1', async () => {
    const doc = (
      <doc>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"---"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders 2', async () => {
    const doc = (
      <doc>
        <hr />
        <para>hello</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "---

      hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders 3', async () => {
    const doc = (
      <doc>
        <para>hello</para>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "hello

      ---"
    `);
  });
});
