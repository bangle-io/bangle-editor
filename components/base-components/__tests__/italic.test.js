/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  sendKeyToPm,
  setSelectionNear,
  typeText,
} from '@bangle.dev/test-helpers';
import { italic } from '../src/index';
import { defaultTestEditor } from './test-editor';

const keybindings = italic.defaultKeys;

describe('Basic', () => {
  const testEditor = defaultTestEditor();

  test('toggles Italic correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleItalic);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleItalic);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsItalicActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    italic.commands.toggleItalic()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <italic>world</italic>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(italic.commands.queryIsItalicActive()(view.state)).toBe(true);
  });
});

describe('markdown shortcuts', () => {
  const testEditor = defaultTestEditor();

  test('_ shortcut', async () => {
    const { editorView } = testEditor(
      <doc>
        <para>first</para>
        <para>[]</para>
      </doc>,
    );

    typeText(editorView, '_magic_');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <para>
          <italic>magic</italic>
        </para>
      </doc>,
    );
  });

  test('_ shortcut after a word', async () => {
    const { editorView } = testEditor(
      <doc>
        <para>first</para>
        <para>hey there []</para>
      </doc>,
    );

    typeText(editorView, '_sweety_');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <para>
          hey there <italic>sweety</italic>
        </para>
      </doc>,
    );
  });

  test('_ shortcut while inside a word', async () => {
    const { editorView } = testEditor(
      <doc>
        <para>first</para>
        <para>hey there[]</para>
      </doc>,
    );

    typeText(editorView, '_omg_');
    expect(editorView.state).toEqualDocAndSelection(
      <doc>
        <para>first</para>
        <para>hey there_omg_</para>
      </doc>,
    );
  });
});
