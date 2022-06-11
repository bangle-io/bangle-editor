/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, sendKeyToPm, setSelectionNear } from '@bangle.dev/test-helpers';
import { strike } from '../src/index';
import { defaultTestEditor } from './test-editor';

const keybindings = strike.defaultKeys;

describe('Basic', () => {
  const testEditor = defaultTestEditor();

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
