/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

describe('paragraphs', () => {
  test('paragraph 1', async () => {
    const doc = (
      <doc>
        <para>hello world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello world"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('paragraph 2', async () => {
    const doc = (
      <doc>
        <para>hello world</para>
        <para>bye world</para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "hello world

      bye world"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('paragraph multiple spaces', async () => {
    const doc = (
      <doc>
        <para>{'hello        world'}</para>
        <para>bye world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`
      "hello        world

      bye world"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('when parsing paragraph with spaces at start and end, they are removed', async () => {
    const doc = (
      <doc>
        <para>{' hello world '}</para>
        <para>bye world</para>
      </doc>
    );

    const md = await serialize(doc);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello world</para>
        <para>bye world</para>
      </doc>,
    );
  });

  test.each(['`', '\\', ...`'"~!@#$%^&*(){}-+=_:;,<.>/?`])(
    'Case %# misc char %s',
    async (str) => {
      const doc = (
        <doc>
          <para>hello world{str}s</para>
        </doc>
      );

      let md = await serialize(doc);
      expect(md).toMatchSnapshot();
      expect(await parse(md)).toEqualDocument(doc);
    },
  );

  test('new line', async () => {
    const doc = (
      <doc>
        <para>hello {'\n'}world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello \nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello{'\n'}world</para>
      </doc>,
    );
  });

  test('multiple new line', async () => {
    const doc = (
      <doc>
        <para>hello {'\n\n\n'}world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello \n\n\nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello</para>
        <para>world</para>
      </doc>,
    );
  });
  // TODO decide what we wanna do with empty
  // paragraph: introduce a br or just ignore them
  test('multiple empty paragraph are omitted', async () => {
    const doc = (
      <doc>
        <para>hello</para>
        <para></para>
        <para></para>
        <para></para>
        <para>world</para>
      </doc>
    );

    const md = await serialize(doc);
    expect(md).toEqual('hello\n\nworld');
    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>hello</para>
        <para>world</para>
      </doc>,
    );
  });
});
