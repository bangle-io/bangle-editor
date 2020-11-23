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

  test('queryIsSelectionInStrike works correctly', async () => {
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

    expect(strike.commands.queryIsSelectionInStrike()(view.state)).toBe(true);
  });
});
