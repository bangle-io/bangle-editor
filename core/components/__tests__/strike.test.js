/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from '../../test-helpers/test-helpers';

import { setSelectionNear } from '../../test-helpers/selection-helpers';
import { strike } from '../components';

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
