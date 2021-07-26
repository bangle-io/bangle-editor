/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx, sendKeyToPm, setSelectionNear } from '@bangle.dev/test-helpers';
import { bold } from '../index';
import { defaultTestEditor } from './test-editor';

const keybindings = bold.defaultKeys;

describe('Basic', () => {
  const testEditor = defaultTestEditor();

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
