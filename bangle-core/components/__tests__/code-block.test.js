/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import {
  psx,
  renderTestEditor,
  sendKeyToPm,
} from 'bangle-core/test-helpers/index';
import { codeBlock } from '../index';

const testEditor = renderTestEditor();
const keybindings = codeBlock.defaultKeys;

describe('basic', () => {
  test('toCodeBlock works', () => {
    const { view } = testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );
    sendKeyToPm(view, keybindings.toCodeBlock);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <codeBlock>foo[]bar</codeBlock>
      </doc>,
    );
  });

  test('movingUp works', () => {
    const { view } = testEditor(
      <doc>
        <para>hello world</para>
        <codeBlock>foo[]bar</codeBlock>
      </doc>,
    );
    sendKeyToPm(view, keybindings.moveUp);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <codeBlock>foo[]bar</codeBlock>
        <para>hello world</para>
      </doc>,
    );
  });

  test('moveDown works', () => {
    const { view } = testEditor(
      <doc>
        <codeBlock>foo[]bar</codeBlock>
        <para>hello world</para>
      </doc>,
    );
    sendKeyToPm(view, keybindings.moveDown);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello world</para>
        <codeBlock>foo[]bar</codeBlock>
      </doc>,
    );
  });
});

describe('Insert empty paragraph above and below', () => {
  test.each([
    [
      <doc>
        <codeBlock>foo[]bar</codeBlock>
      </doc>,
      <doc>
        <para>[]</para>
        <codeBlock>foobar</codeBlock>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <codeBlock>hello[]</codeBlock>
      </doc>,
      <doc>
        <para>top</para>
        <para>[]</para>
        <codeBlock>hello</codeBlock>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello[]</codeBlock>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <codeBlock>hello</codeBlock>
      </doc>,
    ],
  ])('Case %# insert empty paragraph above', async (input, expected) => {
    const { view } = testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyParaAbove);

    expect(view.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <codeBlock>foo[]bar</codeBlock>
      </doc>,
      <doc>
        <codeBlock>foobar</codeBlock>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <codeBlock>hello[]</codeBlock>
      </doc>,
      <doc>
        <para>top</para>
        <codeBlock>hello</codeBlock>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello[]</codeBlock>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello</codeBlock>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { view } = testEditor(input);

    sendKeyToPm(view, keybindings.insertEmptyParaBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
