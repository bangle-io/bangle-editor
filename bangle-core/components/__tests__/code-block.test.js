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

    sendKeyToPm(view, keybindings.insertEmptyAbove);

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

    sendKeyToPm(view, keybindings.insertEmptyBelow);

    expect(view.state).toEqualDocAndSelection(expected);
  });
});
