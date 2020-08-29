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

describe('Basics', () => {
  test('is able to type paragraph', async () => {
    const { editor } = await testEditor(doc(p('foo{<>}bar')));

    typeText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(doc(p('foohello{<>}bar')));
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

  // TODO this is broken for some reason
  test.skip('is able to backspace', async () => {
    const { editor } = await testEditor(doc(p('foobar{<>}')));

    sendKeyToPm(editor.view, 'Backspace');

    expect(editor.state).toEqualDocAndSelection(doc(p('fooba{<>}')));
  });
});

describe.only('Moving selection start and end', () => {
  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('foobar{<>}')));

    sendKeyToPm(editor.view, 'Ctrl-a');

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('f{<>}oobar')));

    sendKeyToPm(editor.view, 'Ctrl-a');

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('{<>}foobar')));

    sendKeyToPm(editor.view, 'Ctrl-a');

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to start when inside a list', async () => {
    const { editor } = await testEditor(doc(ul(li(p('foobar{<>}')))));

    sendKeyToPm(editor.view, 'Ctrl-a');

    expect(editor.state).toEqualDocAndSelection(doc(ul(li(p('{<>}foobar')))));
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(doc(p('{<>}foobar')));

    sendKeyToPm(editor.view, 'Ctrl-e');

    expect(editor.state).toEqualDocAndSelection(doc(p('foobar{<>}')));
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(doc(p('fooba{<>}r')));

    sendKeyToPm(editor.view, 'Ctrl-e');

    expect(editor.state).toEqualDocAndSelection(doc(p('foobar{<>}')));
  });

  it('Moves selection to end when inside a list', async () => {
    const { editor } = await testEditor(doc(ul(li(p('{<>}foobar')))));

    sendKeyToPm(editor.view, 'Ctrl-e');

    expect(editor.state).toEqualDocAndSelection(doc(ul(li(p('foobar{<>}')))));
  });
});

test.todo('Bold italics etc');
test.todo('Convert to different node type to para');

describe('Moving up and down', () => {
  const check = async (beforeDoc, afterDoc) => {
    const { editorView } = await testEditor(beforeDoc);
    sendKeyToPm(editorView, 'Alt-Up');
    expect(editorView.state).toEqualDocAndSelection(afterDoc);
    sendKeyToPm(editorView, 'Alt-Down');
    expect(editorView.state).toEqualDocAndSelection(beforeDoc);
  };

  it('basic', async () => {
    await check(
      doc(p('foobar'), p('hello{<>}')),
      doc(p('hello{<>}'), p('foobar')),
    );
  });

  it('works with underline ', async () => {
    await check(
      doc(p('foobar'), p('hel', underline('lo{<>}'))),
      doc(p('hel', underline('lo{<>}')), p('foobar')),
    );
  });

  it('works with hard break', async () => {
    await check(
      doc(p('foobar'), p('hello{<>}', br(), 'why')),
      doc(p('hello{<>}', br(), 'why'), p('foobar')),
    );
  });

  it('works with hard break', async () => {
    await check(
      doc(p('foobar'), p('hello', br(), '{<>}why')),
      doc(p('hello', br(), '{<>}why'), p('foobar')),
    );
  });

  it('swaps with ul list', async () => {
    // prettier-ignore
    await check(
      doc(
        p('foobar'), 
        ul(li(p('hello', br())), li(p('why'))),
        p('{<>}lorem'),
      ),
      doc(
        p('foobar'), 
        p('{<>}lorem'),
        ul(li(p('hello', br())), li(p('why'))),
      ),
    );
  });

  it('swaps with ol list', async () => {
    // prettier-ignore
    await check(
      doc(
        p('foobar'), 
        ol(li(p('hello', br())), li(p('why'))),
        p('{<>}lorem'),
      ),
      doc(
        p('foobar'), 
        p('{<>}lorem'),
        ol(li(p('hello', br())), li(p('why'))),
      ),
    );
  });

  it('swaps with ol list', async () => {
    // prettier-ignore
    await check(
      doc(
        p('foobar'), 
        ol(li(p('hello', br())), li(p('why'))),
        p('{<>}lorem'),
      ),
      doc(
        p('foobar'), 
        p('{<>}lorem'),
        ol(li(p('hello', br())), li(p('why'))),
      ),
    );
  });

  it('swaps with heading', async () => {
    // prettier-ignore
    await check(
      doc(
        p('foobar'), 
        h1('hi'),
        p('{<>}lorem'),
      ),
      doc(
        p('foobar'), 
        p('{<>}lorem'),
        h1('hi'),
      ),
    );
  });

  it('swaps with codeBlock', async () => {
    // prettier-ignore
    await check(
      doc(
        p('foobar'), 
        codeBlock()('hi'),
        p('{<>}lorem'),
      ),
      doc(
        p('foobar'), 
        p('{<>}lorem'),
        codeBlock()('hi'),
      ),
    );
  });
});
