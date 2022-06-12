/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';

import { parse, serialize } from './setup';

describe('heading', () => {
  test('renders 1', async () => {
    const doc = (
      <doc>
        <para>top</para>
        <heading level={1}>hello[]</heading>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "top

      # hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders 2', async () => {
    const doc = (
      <doc>
        <para>top</para>
        <heading level={3}>hello[]</heading>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "top

      ### hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });
});
