/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/core/test-helpers/index';
import { serialize, parse } from './setup';

describe('ordered list', () => {
  test('renders ordered list', async () => {
    const doc = (
      <doc>
        <ol tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"1. hello"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders ordered list with 2 items', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      2. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  // TODO do we want this behaviour
  test('when parsing 2 adjacent ordered list, it fuses them into 1', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello


      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>,
    );
  });

  test('renders paragraph between 2 ordered list', async () => {
    const doc = (
      <doc>
        <ol tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <para>world</para>
        <ol tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      world

      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders hr between 2 ordered list', async () => {
    const doc = (
      <doc>
        <ol tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <hr />
        <ol tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );

    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. hello

      ---

      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders paragraph followed by 2 ordered list', async () => {
    const doc = (
      <doc>
        <para>world</para>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
        <ol>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "world

      1. hello


      1. hello"
    `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <para>world</para>
        <ol>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ol>
      </doc>,
    );
  });

  test('renders list with multiple paragraph', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>text</para>
            <para>other</para>
          </li>
          <li>
            <para>text</para>
            <para>other</para>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. text

         other

      2. text

         other"
    `);

    expect(await parse(md)).toEqualDocument(doc);
  });
});

describe('unordered list', () => {
  test('renders unordered list', async () => {
    const doc = (
      <doc>
        <ul tight={true}>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"- hello"`);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders unordered list with 2 children', async () => {
    const doc = (
      <doc>
        <ul>
          <li>
            <para>hello</para>
          </li>
          <li>
            <para>hello</para>
          </li>
        </ul>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "- hello

      - hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders unordered list nested inside ordered list', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>parent</para>
            <ul>
              <li>
                <para>hello</para>
              </li>
              <li>
                <para>hello</para>
              </li>
            </ul>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. parent

         - hello

         - hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders unordered list nested inside ordered list with tight to true', async () => {
    const doc = (
      <doc>
        <ol>
          <li>
            <para>parent</para>
            <ul tight={true}>
              <li>
                <para>hello</para>
              </li>
              <li>
                <para>hello</para>
              </li>
            </ul>
          </li>
        </ol>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
      "1. parent

         - hello
         - hello"
    `);
    expect(await parse(md)).toEqualDocument(doc);
  });
});
