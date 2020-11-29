/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@banglejs/core/test-helpers/index';
import { serialize, parse } from './setup';

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
