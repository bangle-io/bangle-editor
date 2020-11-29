/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';
import { serialize, parse } from './setup';

describe('image', () => {
  const image =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==';

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image alt="image" src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello[]
          <image label="dot" alt="image" src={image} />
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(
      `"hello![image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAACCAYAAAB/qH1jAAAAH0lEQVQYGWN4/fr1f1FR0f8MDAwQnJOTA+cYGRn9BwDvaAzTLxVZaQAAAABJRU5ErkJggg==)"`,
    );

    expect(await parse(md)).toEqualDocument(doc);
  });

  test('renders', async () => {
    const doc = (
      <doc>
        <para>
          hello
          <image src="image.jpg" title="image" alt="image" />
          []
        </para>
      </doc>
    );
    const md = await serialize(doc);

    expect(md).toMatchInlineSnapshot(`"hello![image](image.jpg \\"image\\")"`);

    expect(await parse(md)).toEqualDocument(doc);
  });
});
