/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
  typeChar,
  typeText,
} from 'bangle-core/test-helpers/index';

import { setSelectionNear } from 'bangle-core/test-helpers/selection-helpers';
import { code } from '../index';

const keybindings = code.defaultKeys;

describe('Basic', () => {
  const testEditor = renderTestEditor();

  test('toggles Code correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleCode);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <code>world</code>
        </para>
      </doc>,
    );

    sendKeyToPm(view, keybindings.toggleCode);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>hello world</para>
      </doc>,
    );
  });

  test('queryIsSelectionInCode works correctly', async () => {
    const { view } = testEditor(
      <doc>
        <para>hello [world]</para>
      </doc>,
    );

    code.commands.toggleCode()(view.state, view.dispatch, view);

    expect(view.state.doc).toEqualDocument(
      <doc>
        <para>
          hello <code>world</code>
        </para>
      </doc>,
    );

    setSelectionNear(view, 9);

    expect(code.commands.queryIsSelectionInCode()(view.state)).toBe(true);
  });
});

/**
 * WARNING about these escape arrow tests
 * The pm editor does not handle text selection
 * movements and lets browsers deal with it. So we will
 * not be able to reproduce that in test. It will only
 * deal when a keybinding handles the arrow left or right.
 */
describe('Escaping code move left', () => {
  // Visualization
  //    0      1   2   3   4   5   6          7
  // <para/>     a   b   c   d   e    </para>
  const testEditor = renderTestEditor();

  test.each([
    [
      'at right edge, doesnt enter code with one left move',
      ['left', 'x'],
      <doc>
        <para>
          a<code>bcd</code>e[]
        </para>
      </doc>,
      <doc>
        <para>
          a<code>bcd</code>x[]e
        </para>
      </doc>,
    ],
    [
      'at right edge, enter code with two one left move',
      ['left', 'left', 'x'],
      <doc>
        <para>
          a<code>bcd</code>e[]
        </para>
      </doc>,
      <doc>
        <para>
          a<code>bcdx[]</code>e
        </para>
      </doc>,
    ],

    [
      'at right edge, one char code',
      ['left', 'x'],
      <doc>
        <para>
          a<code>b</code>[]
        </para>
      </doc>,
      <doc>
        <para>
          a<code>x[]b</code>
        </para>
      </doc>,
    ],
    [
      'at right edge, one char code, two lefts',
      ['left', 'left', 'x'],
      <doc>
        <para>
          a<code>b</code>[]
        </para>
      </doc>,
      <doc>
        <para>
          ax[]<code>b</code>
        </para>
      </doc>,
    ],

    [
      'at left edge, doesnt exit code with one left move',
      ['left', 'x'],
      <doc>
        <para>
          a<code>b[]cd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          a<code>xbcd</code>e
        </para>
      </doc>,
    ],

    [
      'at left edge, exit codes when selection at edge',
      ['left', 'x'],
      <doc>
        <para>
          a<code>[]bcd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          ax<code>bcd</code>e
        </para>
      </doc>,
    ],

    [
      'at left edge, exits code with two left move',
      ['left', 'left', 'x'],
      <doc>
        <para>
          a<code>b[]cd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          ax<code>bcd</code>e
        </para>
      </doc>,
    ],

    [
      'at left edge with nothing before, exits code with two left move',
      ['left', 'left', 'x'],
      <doc>
        <para>
          <code>b[]cd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          x<code>bcd</code>e
        </para>
      </doc>,
    ],

    [
      'at left edge with another mark before',
      ['left', 'left', 'x'],
      <doc>
        <para>
          <bold>world</bold>
          <code>b[]cd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          <bold>world</bold>x<code>bcd</code>e
        </para>
      </doc>,
    ],
  ])('Case %# %s ', async (name, keys, input, expected) => {
    let { view } = testEditor(input);

    keys.forEach((key) => {
      if (key === 'left') {
        sendKeyToPm(view, 'ArrowLeft');
      } else if (key === 'right') {
        sendKeyToPm(view, 'ArrowRight');
      } else {
        typeChar(view, key);
      }
    });

    expect(view.state.doc).toEqualDocument(expected);
  });
});

describe('Escaping code move right', () => {
  // Visualization
  //    0      1   2   3   4   5   6          7
  // <para/>     a   b   c   d   e    </para>
  const testEditor = renderTestEditor();

  test.each([
    [
      'at right edge, doesnt enter code with one right move',
      ['right', 'x'],
      <doc>
        <para>
          a[]<code>bcd</code>e
        </para>
      </doc>,
      <doc>
        <para>
          a<code>xbcd</code>e
        </para>
      </doc>,
    ],

    [
      'at right edge, doesnt enter code with one right move',
      ['right', 'x'],
      <doc>
        <para>
          a<code>bcd[]</code>e
        </para>
      </doc>,
      <doc>
        <para>
          a<code>bcd</code>xe
        </para>
      </doc>,
    ],
  ])('Case %# %s ', async (name, keys, input, expected) => {
    let { view } = testEditor(input);

    keys.forEach((key) => {
      if (key === 'left') {
        sendKeyToPm(view, 'ArrowLeft');
      } else if (key === 'right') {
        sendKeyToPm(view, 'ArrowRight');
      } else {
        typeChar(view, key);
      }
    });

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
