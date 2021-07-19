/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { setSelectionNear } from '../../test-helpers/selection-helpers';
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from '../../test-helpers/test-helpers';
import { italic } from '../components';

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
