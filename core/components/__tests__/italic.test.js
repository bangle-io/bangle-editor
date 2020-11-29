/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from '@banglejs/core/test-helpers/index';

import { setSelectionNear } from '@banglejs/core/test-helpers/selection-helpers';
import { italic } from '../index';

const keybindings = italic.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

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
