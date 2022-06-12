/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';

import { parse, serialize } from './setup';

describe('doc empty', () => {
  test('renders', async () => {
    const doc = (
      <doc>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`""`);

    expect(await parse(md)).toEqualDocument(doc);
  });
});
