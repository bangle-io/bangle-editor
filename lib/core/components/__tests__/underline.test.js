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
import { underline } from '../components';

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
