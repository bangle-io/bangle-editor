/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { SpecRegistry } from '@bangle.dev/core';
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
  setSelectionNear,
} from '@bangle.dev/test-helpers';
import { subscript, superscript } from '../index';

const toggleKey = 'Ctrl-s';
const specRegistry = new SpecRegistry([superscript.spec(), subscript.spec()]);
const plugins = [
  subscript.plugins({
    keybindings: {
      toggleSubscript: toggleKey,
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
          hello <subscript>world</subscript>
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

  test('queryIsSubscriptActive works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    expect(subscript.commands.queryIsSubscriptActive()(view.state)).toBe(false);

    subscript.commands.toggleSubscript()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <subscript>world</subscript>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(subscript.commands.queryIsSubscriptActive()(view.state)).toBe(true);
  });
});
