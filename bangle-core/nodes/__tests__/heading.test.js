/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx, renderTestEditor, sendKeyToPm } from 'bangle-core/test-helpers';
import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import { Underline } from '../../marks';

import { CodeBlock } from '../code-block';
import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import { Blockquote } from '../blockquote';
import { TodoList } from '../todo-list';
import { TodoItem } from '../todo-item';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
  new Heading(),
  new Underline(),
  new TodoList(),
  new TodoItem(),
  new Blockquote(),
  new CodeBlock(),
];

const testEditor = renderTestEditor({ extensions });

describe('Insert empty paragraph above and below', () => {
  test.each([
    [
      <doc>
        <heading level="1">foo[]bar</heading>
      </doc>,
      <doc>
        <para>[]</para>
        <heading level="1">foobar</heading>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <para>[]</para>
        <heading level="1">hello</heading>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <heading level="1">hello</heading>
      </doc>,
    ],
  ])('Case %# insert empty paragraph above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each([
    [
      <doc>
        <heading level="1">foo[]bar</heading>
      </doc>,
      <doc>
        <heading level="1">foobar</heading>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>top</para>
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <para>top</para>
        <heading level="1">hello</heading>
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
        <heading level="1">hello[]</heading>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <heading level="1">hello</heading>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
