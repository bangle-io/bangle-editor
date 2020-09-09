/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { sendKeyToPm, psx, renderTestEditor } from '../../../../test-helpers';
import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import { Underline } from '../../../../../src/utils/bangle-utils/marks';
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
        <blockquote>
          <para>foo[]bar</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]foobar</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>foobar</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
      </doc>,
    ],
    [
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <para>[]</para>
        <blockquote>
          <para>hello</para>
        </blockquote>
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
        <blockquote>
          <para>foo[]bar</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]foobar</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>foobar</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para>[]</para>
        </blockquote>
      </doc>,
      <doc>
        <para>other paragraph</para>
        <blockquote>
          <para>hello</para>
          <para></para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
    [
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello[]</para>
        </blockquote>
      </doc>,
      <doc>
        <blockquote>
          <para>top</para>
        </blockquote>
        <blockquote>
          <para>hello</para>
        </blockquote>
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
        <blockquote>
          <para>[]hello</para>
        </blockquote>
      </doc>,
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <blockquote>
          <para>hello</para>
        </blockquote>
        <para>[]</para>
      </doc>,
    ],
  ])('Case %# insert empty paragraph below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
