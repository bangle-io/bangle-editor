/**
 * @jest-environment jsdom
 */

import '../../../../../src/test-helpers/jest-helpers';

import {
  doc,
  ul,
  li,
  p,
  ol,
  br,
  h1,
  codeBlock,
  underline,
} from '../../../../../src/test-helpers/test-builders';
import { renderTestEditor } from '../../../../../src/test-helpers/render-test-editor';
import { applyCommand } from '../../../../../src/test-helpers/commands-helpers';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import {
  sendKeyToPm,
  typeText,
} from '../../../../../src/test-helpers/keyboard';
import { GapCursorSelection } from '../../../../../src/utils/bangle-utils/gap-cursor';
import { Underline } from '../../../../../src/utils/bangle-utils/marks';

import { CodeBlock } from '../code-block';
import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import {
  enterKeyCommand,
  splitListItem,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';
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
  test.each(
    // prettier-ignore
    [
      [
        doc(codeBlock()('foo{<>}bar')),
        doc(p('{<>}'), codeBlock()('foobar')),
      ],
      [
        doc(
          p('top'),
          codeBlock()('hello{<>}'),
        ), 
        doc(
          p('top'),
          p('{<>}'), 
          codeBlock()('hello'),
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          codeBlock()('hello{<>}'),
        ), 
        doc(
          ul(li(p('top'))),
          p('{<>}'), 
          codeBlock()('hello'),
        )
      ]
    ],
  )('Case %# insert empty paragraph above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each(
    // prettier-ignore
    [
      [
        doc(codeBlock()('foo{<>}bar')),
        doc(codeBlock()('foobar'), p('{<>}')),
      ],
      [
        doc(
          p('top'),
          codeBlock()('hello{<>}'),
        ), 
        doc(
          p('top'),
          codeBlock()('hello'),
          p('{<>}'), 
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          codeBlock()('hello{<>}'),
        ), 
        doc(
          ul(li(p('top'))),
          codeBlock()('hello'),
          p('{<>}'), 
        )
      ]
    ],
  )('Case %# insert empty paragraph below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
