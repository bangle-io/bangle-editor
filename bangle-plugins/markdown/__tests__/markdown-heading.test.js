/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

describe('heading', () => {
  test('renders', async () => {
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

  test('renders', async () => {
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
