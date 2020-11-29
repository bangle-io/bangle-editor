/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

describe('marks', () => {
  test('link', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="https://example.com">https://example.com</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello world<https://example.com>"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with content', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="https://example.com">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello world[example](https://example.com)"`,
    );
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with relative url', async () => {
    const doc = (
      <doc>
        <para>
          hello world
          <link href="./example.png">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello world[example](./example.png)"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('link with relative url and asterisk', async () => {
    const doc = (
      <doc>
        <para>
          hello world <link href="./example*.png">example</link>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toEqual('hello world [example](./example\\*.png)');
    expect(await parse(md)).toEqualDocument(doc);
  });

  // todo fix me
  test('strike link', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <strike>
            world
            <link href="./example.png">example</link>
          </strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)"`,
    );
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('strike link italic', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <strike>
            world
            <link href="./example.png">example</link>
            <italic>again</italic>
          </strike>{' '}
          !
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello ~~world~~[~~example~~](./example.png)_~~again~~_ !"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('strike', async () => {
    const doc = (
      <doc>
        <para>
          hello <strike>world</strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello ~~world~~"`);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('asterix', async () => {
    const doc = (
      <doc>
        <para>*hello* world</para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"\\\\*hello\\\\* world"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('bold 1', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <bold>world</bold>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello**world**"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('bold 2', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <bold>world </bold>
          <italic>say hello</italic>
          <strike> bye world </strike>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello**world** _say hello_ ~~bye world~~ "`,
    );

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello
          <bold>world</bold> <italic>say hello</italic>{' '}
          <strike>bye world</strike>
        </para>
      </doc>,
    );
  });

  test('italic', async () => {
    const doc = (
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello _world_"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('italic and bold', async () => {
    const doc = (
      <doc>
        <para>
          hello{' '}
          <bold>
            <italic>world</italic>
          </bold>
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello **_world_**"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('underline', async () => {
    const doc = (
      <doc>
        <para>
          hello <underline>world</underline>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello _world_"`);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>,
    );
  });

  test('code', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>world</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toMatchInlineSnapshot(`"hello \`world\`"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('code escaping 1', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>worl`d</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello `` worl`d ``');
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('code escaping 2', async () => {
    const doc = (
      <doc>
        <para>
          hello <code>_world_</code>
        </para>
      </doc>
    );
    const md = await serialize(doc);
    expect(md).toEqual('hello `_world_`');
    expect(await parse(md)).toEqualDocument(doc);
  });
});
