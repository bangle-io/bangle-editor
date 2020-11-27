/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { BangleEditor } from 'bangle-core/editor';
import { SpecRegistry } from 'bangle-core/spec-sheet';
import { psx, renderTestEditor } from 'bangle-core/test-helpers/index';

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
    const editor = new BangleEditor(document.createElement('div'), {
      specRegistry: new SpecRegistry(),
      stateOpts: {
        content: '<h1>My document</h1><p>My favorite president is</p>',
      },
    });

    expect(editor.toHTMLString()).toMatchInlineSnapshot(
      `"<h1>My document</h1><p>My favorite president is</p>"`,
    );
  });
});
