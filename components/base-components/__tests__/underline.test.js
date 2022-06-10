/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, sendKeyToPm, setSelectionNear } from '@bangle.dev/test-helpers';
import { underline } from '../src/index';
import { defaultTestEditor } from './test-editor';

const keybindings = underline.defaultKeys;

describe('Basic', () => {
  const testEditor = defaultTestEditor();

  test('toggles Underline correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleUnderline);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <underline>world</underline>
        </para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleUnderline);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsUnderlineActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    underline.commands.toggleUnderline()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <underline>world</underline>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(underline.commands.queryIsUnderlineActive()(view.state)).toBe(true);
  });
});
