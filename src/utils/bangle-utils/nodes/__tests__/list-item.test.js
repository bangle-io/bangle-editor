/**
 * @jest-environment jsdom
 */
'use strict';

import 'test-helpers/jest-helpers';

import { doc, ul, li, p } from 'test-helpers/test-builders';
import { renderTestEditor } from 'test-helpers/render-test-editor';
import { applyCommand } from 'test-helpers/commands-helpers';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import { splitListItem, enterKeyCommand, ListItem } from '../list-item';
import { sendKeyToPm, insertText } from 'test-helpers/keyboard';

const extensions = [new BulletList(), new ListItem(), new OrderedList()];

describe('Command: split list ', () => {
  test('splits list', async () => {
    const { editorState, schema } = await renderTestEditor({
      extensions,
      testDoc: doc(ul(li(p('foo{<>}bar')))),
    });

    const split = splitListItem(schema.nodes.list_item);
    const cmd = applyCommand(split);

    expect(await cmd(editorState)).toEqualDocAndSelection(
      doc(ul(li(p('foo')), li(p('bar')))),
    );
  });
});

describe('Command: enter list', () => {
  let updateDoc,
    editorView,
    cmd = applyCommand(enterKeyCommand);

  beforeEach(async () => {
    ({ editorView, updateDoc } = await renderTestEditor({
      extensions,
    }));
  });

  test('creates a new list when pressed enter at end', async () => {
    updateDoc(doc(ul(li(p('foobar{<>}')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('foobar')), li(p('{<>}')))),
    );
  });

  test('splits list', async () => {
    updateDoc(doc(ul(li(p('foo{<>}bar')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('foo')), li(p('bar')))),
    );
  });

  test('Handles if two items in list', async () => {
    updateDoc(doc(ul(li(p('first')), li(p('second{<>}third')))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('second')), li(p('third')))),
    );
  });

  test('outdents to an empty para if enter on empty non-nested list', async () => {
    updateDoc(doc(ul(li(p('first')), li(p('{<>}'))), p('end')));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first'))), p('{<>}'), p('end')),
    );
  });

  test('outdents to first list if enter on empty 2nd nest list', async () => {
    updateDoc(doc(ul(li(p('first'), ul(li(p('{<>}')))))));

    expect(await cmd(editorView.state)).toEqualDocAndSelection(
      doc(ul(li(p('first')), li(p('{<>}')))),
    );
  });
});

describe('ReactEditor: Keymap', () => {
  test('Typing works', async () => {
    const { editor } = await renderTestEditor({
      extensions,
      testDoc: doc(ul(li(p('foo{<>}bar')))),
    });

    insertText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('foohello{<>}bar')))),
    );
  });

  test('Pressing enter works', async () => {
    const { editor } = await renderTestEditor({
      extensions,
      testDoc: doc(ul(li(p('foo{<>}bar')))),
    });

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('foo')), li(p('{<>}bar')))),
    );
  });
});
