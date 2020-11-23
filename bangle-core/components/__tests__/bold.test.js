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

  test('Bolds correctly', async () => {
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

    bold.commands.toggleBold()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsSelectionInBold works correctly', async () => {
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

    expect(
      bold.commands.queryIsSelectionInBold()(view.state, view.dispatch, view),
    ).toBe(true);
  });
});
