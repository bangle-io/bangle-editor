/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';

import { setSelectionNear } from 'bangle-core/test-helpers/selection-helpers';
import { underline } from '../index';

const keybindings = underline.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

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
