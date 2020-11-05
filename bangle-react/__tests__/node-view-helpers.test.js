import { SpecSheet } from 'bangle-core/spec-sheet';
import { serializationHelpers } from 'bangle-react/node-view-helpers';

describe('serializationHelpers parseDOM', () => {
  test('basic', () => {
    const spec = {
      name: 'dummy',
      type: 'node',
      schema: {
        inline: true,
      },
    };
    const result = serializationHelpers(spec);

    expect(result.parseDOM).toHaveLength(1);
    const parseDOM = result.parseDOM[0];
    expect(parseDOM.tag).toMatchInlineSnapshot(
      `"span[data-type=\\"\\"dummy\\"\\"]"`,
    );

    const dom = document.createElement('span');
    dom.setAttribute('data-one', '1');
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`
      Object {
        "data-one": 1,
      }
    `);
  });

  test('rejects non data- attrs', () => {
    const spec = {
      name: 'dummy',
      type: 'node',
      schema: {
        inline: true,
      },
    };
    const [parseDOM] = serializationHelpers(spec).parseDOM;

    const dom = document.createElement('span');
    dom.setAttribute('data-one', '1');
    dom.setAttribute('other-prop', 'abcd');
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`
      Object {
        "data-one": 1,
      }
    `);
  });

  test('accepts custom parsing function', () => {
    const spec = {
      name: 'dummy',
      type: 'node',
      schema: {
        inline: true,
      },
    };
    const [parseDOM] = serializationHelpers(spec, {
      parser: (value, key) => `${value}-${key}`,
    }).parseDOM;

    const dom = document.createElement('span');
    dom.setAttribute('data-one', 'abcd');
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`
      Object {
        "data-one": "abcd-data-one",
      }
    `);
  });
});

describe('serializationHelpers toDOM', () => {
  test('throws error if node does not have data-type', () => {
    const specSheet = new SpecSheet();

    const { toDOM } = serializationHelpers(
      specSheet.spec.find((s) => s.name === 'paragraph'),
    );

    const paraNode = specSheet.schema.nodes['paragraph'].create();

    expect(() => toDOM(paraNode)).toThrowErrorMatchingInlineSnapshot(
      `"Must have data-type"`,
    );
  });

  test('throws error if node does not have data-type', () => {
    const specSheet = new SpecSheet();

    const paraSpecSheet = specSheet.spec.find((s) => s.name === 'paragraph');
    const { toDOM } = serializationHelpers(paraSpecSheet);

    const paraNode = specSheet.schema.nodes['paragraph'].create({
      'data-type': 'paragraph',
    });

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`"Must have data-type"`);
  });
});
