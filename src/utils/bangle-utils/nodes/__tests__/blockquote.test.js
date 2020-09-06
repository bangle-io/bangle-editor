/**
 * @jest-environment jsdom
 */

import '../../../../../src/test-helpers/jest-helpers';

import {
  doc,
  ul,
  li,
  p,
  blockquote,
} from '../../../../../src/test-helpers/test-builders';
import { renderTestEditor } from '../../../../../src/test-helpers/render-test-editor';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import {
  sendKeyToPm,
  typeText,
} from '../../../../../src/test-helpers/keyboard';
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
  test.each(
    // prettier-ignore
    [
      [
        doc(blockquote(p('foo{<>}bar'))), 
        doc(p('{<>}'), blockquote(p('foobar')))
      ],
      [
        doc(blockquote(p('{<>}foobar'))), 
        doc(p('{<>}'), blockquote(p('foobar')))
      ],
      [
        doc(blockquote(p('{<>}'))), 
        doc(p('{<>}'), blockquote(p()))
      ],
      [
        doc(blockquote(p('hello'), p('{<>}'))), 
        doc(p('{<>}'), blockquote(p('hello'), p()))
      ],
      [
        doc(
          p('other paragraph'),
          blockquote(p('hello'), p('{<>}'))
        ), 
        doc(
          p('other paragraph'),
          p('{<>}'), 
          blockquote(p('hello'), p())
        )
      ],
      [
        doc(
          blockquote(p('top')),
          blockquote(p('hello{<>}')),
        ), 
        doc(
          blockquote(p('top')),
          p('{<>}'), 
          blockquote(p('hello'))
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          blockquote(p('hello{<>}')),
        ), 
        doc(
          ul(li(p('top'))),
          p('{<>}'), 
          blockquote(p('hello'))
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
        doc(blockquote(p('foo{<>}bar'))), 
        doc(blockquote(p('foobar')), p('{<>}'))
      ],
      [
        doc(blockquote(p('{<>}foobar'))), 
        doc(blockquote(p('foobar')), p('{<>}'))
      ],
      [
        doc(blockquote(p('{<>}'))), 
        doc(blockquote(p()), p('{<>}'))
      ],
      [
        doc(blockquote(p('hello'), p('{<>}'))), 
        doc(blockquote(p('hello'), p()), p('{<>}'))
      ],
      [
        doc(
          p('other paragraph'),
          blockquote(p('hello'), p('{<>}'))
        ), 
        doc(
          p('other paragraph'),
          blockquote(p('hello'), p()),
          p('{<>}'), 
        )
      ],
      [
        doc(
          blockquote(p('top')),
          blockquote(p('hello{<>}')),
        ), 
        doc(
          blockquote(p('top')),
          blockquote(p('hello')),
          p('{<>}'), 
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          blockquote(p('{<>}hello')),
        ), 
        doc(
          ul(li(p('top'))),
          blockquote(p('hello')),
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
