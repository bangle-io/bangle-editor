import { domSerializationHelpers } from 'bangle-core/dom-serialization-helpers';
import { paragraph, doc, text } from 'bangle-core/index';
import { SpecRegistry } from '../spec-sheet';

describe('domSerializationHelpers parseDOM', () => {
  test('does not get affected by other attributes', () => {
    const spec = {
      name: 'dummy',
      type: 'node',
      schema: {
        inline: true,
      },
    };
    const result = domSerializationHelpers(spec);

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
    const [parseDOM] = domSerializationHelpers(spec).parseDOM;

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
    const [parseDOM] = domSerializationHelpers(spec, {
      parser: (value) => `custom-${value}`,
    }).parseDOM;

    const dom = document.createElement('span');
    dom.setAttribute('data-bangle-attrs', JSON.stringify({ has: 'value' }));
    const attrs = parseDOM.getAttrs(dom);
    expect(attrs).toMatchInlineSnapshot(`"custom-{\\"has\\":\\"value\\"}"`);
  });
});

describe('domSerializationHelpers toDOM', () => {
  test('adds correct attribtues', () => {
    const specRegistry = new SpecRegistry();

    const { toDOM } = domSerializationHelpers(
      specRegistry.spec.find((s) => s.name === 'paragraph'),
    );

    const paraNode = specRegistry.schema.nodes['paragraph'].create();

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
      name: 'codeBlock',
      schema: {
        attrs: {
          timer: {
            default: 1,
          },
        },
      },
    };
    const specRegistry = new SpecRegistry([
      doc.spec(),
      text.spec(),
      paragraph.spec(),
      codeSpec,
    ]);

    const { toDOM } = domSerializationHelpers(codeSpec, {
      container: 'code',
    });

    const paraNode = specRegistry.schema.nodes['codeBlock'].create({});

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`
      Array [
        "code",
        Object {
          "data-bangle-attrs": "{\\"timer\\":1}",
          "data-bangle-id": "codeBlock",
        },
      ]
    `);
  });

  test('excludes attrs', () => {
    const codeSpec = {
      type: 'node',
      name: 'codeBlock',
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

    const specRegistry = new SpecRegistry([
      doc.spec(),
      text.spec(),
      paragraph.spec(),
      codeSpec,
    ]);

    const { toDOM } = domSerializationHelpers(codeSpec, {
      container: 'code',
      allowedAttrs: ['language', 'magic'],
    });

    const paraNode = specRegistry.schema.nodes['codeBlock'].create({});

    expect(toDOM(paraNode)).toMatchInlineSnapshot(`
      Array [
        "code",
        Object {
          "data-bangle-attrs": "{\\"language\\":\\"javascript\\",\\"magic\\":\\"1\\"}",
          "data-bangle-id": "codeBlock",
        },
      ]
    `);
  });
});
