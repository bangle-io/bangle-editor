/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { psx, renderTestEditor } from '@banglejs/core/test-helpers/index';
import { BangleEditorView, editorStateSetup2 } from '../index';

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

describe('editor from html string', () => {
  test('parses html correctly', () => {
    const specRegistry = new SpecRegistry();
    const state = new editorStateSetup2(specRegistry, [], {
      initialValue: '<h1>My document</h1><p>My favorite president is</p>',
    });
    const editor = new BangleEditorView(document.createElement('div'), {
      pmState: state,
      specRegistry,
    });

    expect(editor.toHTMLString()).toMatchInlineSnapshot(
      `"<h1>My document</h1><p>My favorite president is</p>"`,
    );
  });
});
