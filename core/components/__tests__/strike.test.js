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
import { strike } from '../index';

const keybindings = strike.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

  test('toggles Strike correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleStrike);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <strike>world</strike>
        </para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleStrike);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsStrikeActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    strike.commands.toggleStrike()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <strike>world</strike>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(strike.commands.queryIsStrikeActive()(view.state)).toBe(true);
  });
});
