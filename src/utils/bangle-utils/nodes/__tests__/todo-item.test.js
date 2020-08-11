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
  todoList,
  todoItem,
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

import { Heading } from '../heading';
import { HardBreak } from '../hard-break';

import {
  enterKeyCommand,
  splitListItem,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';
import { TodoList } from '../todo-list';
import { TodoItem } from '../todo-item';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new TodoList(),
  new TodoItem(),
  new HardBreak(),
  new Heading(),
  new Underline(),
];
const testEditor = renderTestEditor({ extensions });

test('Typing works', async () => {
  const { editor } = await testEditor(doc(todoList(todoItem(p('foo{<>}bar')))));

  typeText(editor.view, 'hello');

  expect(editor.state).toEqualDocAndSelection(
    doc(todoList(todoItem(p('foohello{<>}bar')))),
  );
});

test('Pressing enter works', async () => {
  const { editor } = await testEditor(doc(todoList(todoItem(p('foo{<>}')))));

  typeText(editor.view, 'hello');
  sendKeyToPm(editor.view, 'Enter');
  typeText(editor.view, 'second');

  expect(editor.state).toEqualDocAndSelection(
    doc(todoList(todoItem(p('foohello')), todoItem(p('second{<>}')))),
  );
});

describe('Pressing Tab', () => {
  test('first list has no effect', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('foo{<>}bar')))),
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('foo{<>}bar')))),
    );
  });
  test('second list nests', async () => {
    const { editor } = await testEditor(
      doc(todoList(todoItem(p('first')), todoItem(p('{<>}second')))),
    );

    sendKeyToPm(editor.view, 'Tab');

    expect(editor.state).toEqualDocAndSelection(
      doc(todoList(todoItem(p('first'), todoList(todoItem(p('{<>}second')))))),
    );
  });
});

it('Typing [ ]  works', async () => {
  const { editorView, sel } = await testEditor(doc(p('{<>}')));

  typeText(editorView, '[ ] my day', sel);
  expect(editorView.state.doc).toEqualDocument(
    doc(todoList(todoItem(p('my day')))),
  );
});

it('Backspacing works', async () => {
  const { editorView, sel } = await testEditor(
    doc(todoList(todoItem(p('foohello')), todoItem(p('{<>}second')))),
  );

  sendKeyToPm(editorView, 'Backspace');
  expect(editorView.state.doc).toEqualDocument(
    doc(todoList(todoItem(p('foohello'))), p('{<>}second')),
  );
});

describe.skip('Press Alt-Up / Down to move list', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(beforeDoc);
  };

  it('if item above exists and selection is at end', async () => {
    await check(
      doc(todoList(todoItem(p('first')), todoItem(p('second{<>}')))),
      doc(todoList(todoItem(p('first')), todoItem(p('second{<>}')))),
      // doc(todoList(todoItem(p('second{<>}')), todoItem(p('first')))),
    );
  });

  it('if item above exists and selection is in between', async () => {
    await check(
      doc(ul(li(p('first')), li(p('sec{<>}ond')))),
      doc(ul(li(p('sec{<>}ond')), li(p('first')))),
    );
  });

  it('if item above exists and selection is at start', async () => {
    await check(
      doc(ul(li(p('first')), li(p('{<>}second')))),
      doc(ul(li(p('{<>}second')), li(p('first')))),
    );
  });

  it('if  first item is very big', async () => {
    await check(
      doc(ul(li(p('first is really big')), li(p('{<>}second')))),
      doc(ul(li(p('{<>}second')), li(p('first is really big')))),
    );
  });
  it('if second item is very big', async () => {
    await check(
      doc(ul(li(p('f')), li(p('{<>}second is really big')))),
      doc(ul(li(p('{<>}second is really big')), li(p('f')))),
    );
  });
  it('if second item is empty', async () => {
    await check(
      doc(ul(li(p('first')), li(p('{<>}')))),
      doc(ul(li(p('{<>}')), li(p('first')))),
    );
  });

  it('if first item is empty', async () => {
    await check(
      doc(ul(li(p('')), li(p('sec{<>}ond')))),
      doc(ul(li(p('sec{<>}ond')), li(p('')))),
    );
  });
});
