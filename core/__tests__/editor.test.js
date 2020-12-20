/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { SpecRegistry } from '../spec-registry';
import { psx, renderTestEditor } from '../test-helpers/index';
import { BangleEditorState, BangleEditor, blockquote, heading } from '../index';
import { coreSpec } from '../utils/core-components';

const testEditor = renderTestEditor();

describe('editor serializes to html', () => {
  test('seriailizes to html', () => {
    const { editor, view } = testEditor(
      <doc>
        <heading>My document</heading>
        <para>My favorite president is[]</para>
      </doc>,
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <heading>My document</heading>
        <para>My favorite president is[]</para>
      </doc>,
    );

    expect(editor.toHTMLString()).toMatchInlineSnapshot(
      `"<h1>My document</h1><p>My favorite president is</p>"`,
    );
  });
});

describe('BangleEditorState', () => {
  test('Takes specRegistry', () => {
    const specRegistry = new SpecRegistry();
    const state = new BangleEditorState({
      specRegistry,
      initialValue: 'Hi',
    });

    expect(state.specRegistry).toBe(specRegistry);
    expect(state.pmState.doc.toJSON()).toMatchInlineSnapshot(`
      Object {
        "content": Array [
          Object {
            "content": Array [
              Object {
                "text": "Hi",
                "type": "text",
              },
            ],
            "type": "paragraph",
          },
        ],
        "type": "doc",
      }
    `);
  });

  test('Creates specRegistry if nothing is passed', () => {
    const state = new BangleEditorState({
      initialValue: 'Hi',
    });

    expect(state.specRegistry).toBeInstanceOf(SpecRegistry);
    expect(state.pmState.doc.toJSON()).toMatchInlineSnapshot(`
      Object {
        "content": Array [
          Object {
            "content": Array [
              Object {
                "text": "Hi",
                "type": "text",
              },
            ],
            "type": "paragraph",
          },
        ],
        "type": "doc",
      }
    `);
  });

  test('Throws error if you pass specs and specRegistry', () => {
    const specRegistry = new SpecRegistry();
    expect(
      () =>
        new BangleEditorState({
          specRegistry,
          specs: [],
          initialValue: 'Hi',
        }),
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot have both specs and specRegistry defined"`,
    );
  });

  describe('Creates specRegistry if only specs is passed', () => {
    const initialValue =
      '<h1>Heading</h1><blockquote><para>Blockquote</para></blockquote>';

    test('Heading spec', () => {
      const state = new BangleEditorState({
        specs: [heading.spec()],
        initialValue,
      });

      expect(state.specRegistry).toBeInstanceOf(SpecRegistry);
      expect(state.pmState.doc).toEqualDocument(
        <doc>
          <heading>Heading</heading>
          {/** NOTICE that blockquote did _not_ get wrapped in blockquote node*/}
          <para>Blockquote</para>
        </doc>,
      );
    });

    test('Blockquote spec', () => {
      const state = new BangleEditorState({
        specs: [heading.spec(), blockquote.spec()],
        initialValue,
      });

      expect(state.specRegistry).toBeInstanceOf(SpecRegistry);
      expect(state.pmState.doc).toEqualDocument(
        <doc>
          <heading>Heading</heading>
          {/** NOTICE that blockquote did get wrapped in blockquote node*/}
          <blockquote>
            <para>Blockquote</para>
          </blockquote>
        </doc>,
      );
    });
  });
});

describe('editor from html string', () => {
  test('parses html correctly', () => {
    const specRegistry = new SpecRegistry(coreSpec());
    const state = new BangleEditorState({
      specRegistry,
      initialValue: '<h1>My document</h1><p>My favorite president is</p>',
    });
    const editor = new BangleEditor(document.createElement('div'), {
      state,
    });

    expect(editor.toHTMLString()).toMatchInlineSnapshot(
      `"<h1>My document</h1><p>My favorite president is</p>"`,
    );
  });
});
