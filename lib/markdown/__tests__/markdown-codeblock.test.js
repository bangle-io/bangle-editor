/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/test-helpers';
import { parse, serialize } from './setup';

describe('codeBlock list', () => {
  test('renders 1', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar</codeBlock>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "\`\`\`
        foobar
        \`\`\`"
      `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders 2', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar`something`</codeBlock>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "\`\`\`
        foobar\`something\`
        \`\`\`"
      `);

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders 3', async () => {
    const doc = (
      <doc>
        <codeBlock>foobar</codeBlock>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "\`\`\`
        foobar
        \`\`\`"
      `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <codeBlock>foobar</codeBlock>
      </doc>,
    );
  });

  test('renders with lang identifier', async () => {
    const doc = (
      <doc>
        <codeBlock language="js">foobar</codeBlock>
        <para></para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`
        "\`\`\`js
        foobar
        \`\`\`"
      `);

    expect(await parse(md)).toEqualDocument(
      <doc>
        <codeBlock language="js">foobar</codeBlock>
      </doc>,
    );
  });
});
