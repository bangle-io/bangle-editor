import { paragraph, doc, text } from 'bangle-core/index';
import { serializationHelpers } from 'bangle-core/node-view';
import { SpecSheet } from '../../spec-sheet';

describe('serializationHelpers parseDOM', () => {
  test('does not get affected by other attributes', () => {
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
      `"span[data-bangle-id=\\"dummy\\"]"`,
    );

    const dom = document.createElement('span');
    dom.setAttribute('data-one', '1');
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`Object {}`);
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
    dom.setAttribute('data-bangle-attrs', JSON.stringify({ has: 'value' }));
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`
      Object {
        "has": "value",
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
      parser: (value) => `custom-${value}`,
    }).parseDOM;

    const dom = document.createElement('span');
    dom.setAttribute('data-bangle-attrs', JSON.stringify({ has: 'value' }));
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`"custom-{\\"has\\":\\"value\\"}"`);
  });
});

describe('serializationHelpers toDOM', () => {
  test('adds correct attribtues', () => {
    const specSheet = new SpecSheet();

    const { toDOM } = serializationHelpers(
      specSheet.spec.find((s) => s.name === 'paragraph'),
    );

    const paraNode = specSheet.schema.nodes['paragraph'].create();

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`
      Array [
        "div",
        Object {
          "data-bangle-attrs": "{}",
          "data-bangle-id": "paragraph",
        },
      ]
    `);
  });

  test('correctly serializes attrs', () => {
    const codeSpec = {
      type: 'node',
      name: 'code_block',
      schema: {
        attrs: {
          timer: {
            default: 1,
          },
        },
      },
    };
    const specSheet = new SpecSheet([
      doc.spec(),
      text.spec(),
      paragraph.spec(),
      codeSpec,
    ]);

    const { toDOM } = serializationHelpers(codeSpec, {
      container: 'code',
    });

    const paraNode = specSheet.schema.nodes['code_block'].create({});

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`
      Array [
        "code",
        Object {
          "data-bangle-attrs": "{\\"timer\\":1}",
          "data-bangle-id": "code_block",
        },
      ]
    `);
  });

  test('excludes attrs', () => {
    const codeSpec = {
      type: 'node',
      name: 'code_block',
      schema: {
        attrs: {
          timer: {
            default: 1,
          },
          language: { default: 'javascript' },
          magic: { default: '1' },
        },
      },
    };

    const specSheet = new SpecSheet([
      doc.spec(),
      text.spec(),
      paragraph.spec(),
      codeSpec,
    ]);

    const { toDOM } = serializationHelpers(codeSpec, {
      container: 'code',
      allowedAttrs: ['language', 'magic'],
    });

    const paraNode = specSheet.schema.nodes['code_block'].create({});

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`
      Array [
        "code",
        Object {
          "data-bangle-attrs": "{\\"language\\":\\"javascript\\",\\"magic\\":\\"1\\"}",
          "data-bangle-id": "code_block",
        },
      ]
    `);
  });
});
