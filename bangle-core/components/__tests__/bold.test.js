/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';

import { typeText } from 'bangle-core/test-helpers/index';
import { setSelectionNear } from 'bangle-core/test-helpers/selection-helpers';
import { bold } from '../index';

const keybindings = bold.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

  test('toggles Bold correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleBold);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <bold>world</bold>
        </para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleBold);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsBoldActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    bold.commands.toggleBold()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <bold>world</bold>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(bold.commands.queryIsBoldActive()(view.state)).toBe(true);
  });
});
