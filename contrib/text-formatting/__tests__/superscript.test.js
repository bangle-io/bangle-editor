/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core/index';
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
  setSelectionNear,
} from '@bangle.dev/core/test-helpers/index';

import { superscript, subscript } from '../index';

const toggleKey = 'Ctrl-s';
const specRegistry = new SpecRegistry([subscript.spec(), superscript.spec()]);
const plugins = [
  superscript.plugins({
    keybindings: {
      toggleSuperscript: toggleKey,
    },
  }),
];
describe('Basic', () => {
  const testEditor = renderTestEditor({
    specRegistry,
    plugins,
  });

  test('toggles Strike correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, toggleKey);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <superscript>world</superscript>
        </para>
      </doc>,
    );

    sendKeyToPm(view, toggleKey);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsSuperscriptActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    expect(superscript.commands.queryIsSuperscriptActive()(view.state)).toBe(
      false,
    );

    superscript.commands.toggleSuperscript()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <superscript>world</superscript>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(superscript.commands.queryIsSuperscriptActive()(view.state)).toBe(
      true,
    );
  });
});
