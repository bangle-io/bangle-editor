/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

describe('horizontal rule', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <hr />
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"---"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
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

  test('renders', async () => {
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
