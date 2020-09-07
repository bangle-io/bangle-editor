/**
 * @jest-environment jsdom
 */
import '../../../../test-helpers/jest-helpers';
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
import { renderTestEditor } from '../../../../test-helpers/render-test-editor';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { ListItem } from '../list-item/list-item';
import { sendKeyToPm, typeText } from '../../../../test-helpers/keyboard';
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

describe('Basics', () => {
  test.only('is able to type paragraph', async () => {
    const { editor } = await testEditor(
      doc(ul(li(p('foo'), p('{<>}bar'), p('zoo')))),
    );

    typeText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('foo'), p('hello{<>}bar'), p('zoo')))),
    );
  });

  test('is able to create a new paragraph', async () => {
    const { editor } = await testEditor(doc(p('foo{<>}bar')));

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(doc(p('foo'), p('{<>}bar')));
  });

  test('is able to create a new paragraph', async () => {
    const { editor } = await testEditor(doc(p('foobar{<>}')));

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(doc(p('foobar'), p('{<>}')));
  });
});
