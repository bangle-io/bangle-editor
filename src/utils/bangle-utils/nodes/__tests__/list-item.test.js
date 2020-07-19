/**
 * @jest-environment jsdom
 */
'use strict';

const React = require('react');
const {
  schema,
  eq,
  doc,
  blockquote,
  p,
  li,
  ol,
  ul,
} = require('prosemirror-test-builder');
import { render, waitForElement } from '@testing-library/react';
import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';

import {
  EditorState,
  Selection,
  TextSelection,
  NodeSelection,
} from 'prosemirror-state';

const { splitListItem, enterKeyCommand, ListItem } = require('../list-item');
const testHelpers = require('test-helpers/index');

describe('Split List Command', () => {
  const split = splitListItem(schema.nodes.list_item);
  const cmd = applyCommand(split);
  test('splits list', () => {
    expect(cmd(doc(ul(li(p('foo<a>bar')))))).toEqualDoc(
      doc(ul(li(p('foo')), li(p('bar')))),
    );
  });
});

describe('Enter list command', () => {
  const cmd = applyCommand(enterKeyCommand);

  test('creates a new list when pressed enter at end', () => {
    expect(cmd(doc(ul(li(p('foobar<a>')))))).toEqualDoc(
      doc(ul(li(p('foobar')), li(p()))),
    );
  });

  test('splits list', () => {
    expect(cmd(doc(ul(li(p('foo<a>bar')))))).toEqualDoc(
      doc(ul(li(p('foo')), li(p('bar')))),
    );
  });

  test('Handles if two items in list', () => {
    expect(cmd(doc(ul(li(p('first')), li(p('second<a>third')))))).toEqualDoc(
      doc(ul(li(p('first')), li(p('second')), li(p('third')))),
    );
  });

  test('outdents to an empty para if enter on empty non-nested list', () => {
    const result = cmd(doc(ul(li(p('first')), li(p('<a>'))), p('end')));
    const out = doc(ul(li(p('first'))), p(), p('end'));

    expect(result).toEqualDoc(out);
  });

  test('outdents to first list if enter on empty 2nd nest list', () => {
    const result = cmd(doc(ul(li(p('first'), ul(li(p('<a>')))))));
    const out = doc(ul(li(p('first')), li(p())));
    expect(result).toEqualDoc(out);
  });
});

describe.only('Keymap', () => {
  test('Typing works', async () => {
    const { editor, builders, update } = await testHelpers.renderReactEditor({
      extensions: [new BulletList(), new ListItem(), new OrderedList()],
    });

    const { doc, ul, li, p } = builders;

    update(doc(ul(li(p('foo<a>bar')))));

    testHelpers.insertText(editor.view, 'hello');

    expect(editor.state.doc).toEqualDoc(doc(ul(li(p('foohellobar')))));
  });

  test('Typing works', async () => {
    const { editor, builders, update } = await testHelpers.renderReactEditor({
      extensions: [new BulletList(), new ListItem(), new OrderedList()],
    });
    const { doc, ul, li, p } = builders;

    update(doc(ul(li(p('foo<a>bar')))));

    testHelpers.sendKeyToPm(editor.view, 'Enter');

    expect(editor.state.doc).toEqualDoc(doc(ul(li(p('foo')), li(p('bar')))));
  });
});

function createState(doc, previousState) {
  return EditorState.create({ doc, selection: selFor(doc) });
}
function applyCommand(command) {
  return (doc) => {
    let state = createState(doc);
    command(state, (tr) => (state = state.apply(tr)));
    return state.doc;
  };
}

function selFor(doc) {
  let a = doc.tag.a;
  if (a != null) {
    let $a = doc.resolve(a);
    if ($a.parent.inlineContent)
      return new TextSelection(
        $a,
        doc.tag.b != null ? doc.resolve(doc.tag.b) : undefined,
      );
    else return new NodeSelection($a);
  }
  return Selection.atStart(doc);
}
