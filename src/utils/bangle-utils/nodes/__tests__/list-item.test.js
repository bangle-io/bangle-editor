/**
 * @jest-environment jsdom
 */
'use strict';

import 'test-helpers/jest-helpers';

import { doc, ul, li, p, ol, br } from 'test-helpers/test-builders';
import { renderTestEditor } from 'test-helpers/render-test-editor';
import { applyCommand } from 'test-helpers/commands-helpers';
import { wrappingInputRule, toggleList } from 'tiptap-commands';

import { OrderedList } from '../ordered-list';
import { BulletList } from '../bullet-list';
import {
  splitListItem,
  enterKeyCommand,
  ListItem,
} from '../list-item/list-item';
import { sendKeyToPm, insertText } from 'test-helpers/keyboard';
import { HardBreak } from '../hard-break';

const extensions = [
  new BulletList(),
  new ListItem(),
  new OrderedList(),
  new HardBreak(),
];
const testEditor = renderTestEditor({ extensions });

describe('Command: split list ', () => {
  test('splits list', async () => {
    const { editorState, schema } = await testEditor(
      doc(ul(li(p('foo{<>}bar')))),
    );

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
    ({ editorView, updateDoc } = await testEditor());
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
    const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

    insertText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('foohello{<>}bar')))),
    );
  });

  test('Pressing Enter works', async () => {
    const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

    sendKeyToPm(editor.view, 'Enter');

    expect(editor.state).toEqualDocAndSelection(
      doc(ul(li(p('foo')), li(p('{<>}bar')))),
    );
  });

  describe('Pressing Tab', () => {
    test('first list has no effect', async () => {
      const { editor } = await testEditor(doc(ul(li(p('foo{<>}bar')))));

      sendKeyToPm(editor.view, 'Tab');

      expect(editor.state).toEqualDocAndSelection(doc(ul(li(p('foo{<>}bar')))));
    });
    test('second list nests', async () => {
      const { editor } = await testEditor(
        doc(ul(li(p('first')), li(p('{<>}second')))),
      );

      sendKeyToPm(editor.view, 'Tab');

      expect(editor.state).toEqualDocAndSelection(
        doc(ul(li(p('first'), ul(li(p('{<>}second')))))),
      );
    });
  });

  describe('Pressing Backspace', () => {
    const check = async (beforeDoc, afterDoc) => {
      const { editorView } = await testEditor(beforeDoc);
      sendKeyToPm(editorView, 'Backspace');
      expect(editorView.state).toEqualDocAndSelection(afterDoc);
    };

    it('should outdent a first level list item to paragraph', async () => {
      await check(
        doc(ol(li(p('text')), li(p('{<>}')))),
        doc(ol(li(p('text'))), p('{<>}')),
      );
    });

    it('should outdent a first level list item to paragraph, with content', async () => {
      await check(
        doc(ol(li(p('text')), li(p('{<>}second text')))),
        doc(ol(li(p('text'))), p('{<>}second text')),
      );
    });

    it('should outdent a second level list item to first level', async () => {
      await check(
        doc(ol(li(p('text'), ol(li(p('{<>}')))))),
        doc(ol(li(p('text')), li(p('{<>}')))),
      );
    });

    it('should outdent a second level list item to first level, with content', async () => {
      await check(
        doc(ol(li(p('text'), ol(li(p('{<>}subtext')))))),
        doc(ol(li(p('text')), li(p('{<>}subtext')))),
      );
    });

    it('should move paragraph content back to previous (nested) list item', async () => {
      await check(
        doc(ol(li(p('text'), ol(li(p('text'))))), p('{<>}after')),
        doc(ol(li(p('text'), ol(li(p('text{<>}after')))))),
      );
    });

    it('keeps nodes same level as backspaced list item together in same list', async () => {
      await check(
        doc(
          ol(li(p('{<>}A'), ol(li(p('B')))), li(p('C'))),

          p('after'),
        ),
        doc(
          p('{<>}A'),
          ol(li(p('B')), li(p('C'))),

          p('after'),
        ),
      );
    });

    it('merges two single-level lists when the middle paragraph is backspaced', async () => {
      await check(
        doc(
          ol(li(p('A')), li(p('B'))),

          p('{<>}middle'),

          ol(li(p('C')), li(p('D'))),
        ),
        doc(ol(li(p('A')), li(p('B{<>}middle')), li(p('C')), li(p('D')))),
      );
    });

    it('merges two double-level lists when the middle paragraph is backspaced', async () => {
      await check(
        doc(
          ol(li(p('A'), ol(li(p('B')))), li(p('C'))),

          p('{<>}middle'),

          ol(li(p('D'), ol(li(p('E')))), li(p('F'))),
        ),
        doc(
          ol(
            li(p('A'), ol(li(p('B')))),
            li(p('C{<>}middle')),
            li(p('D'), ol(li(p('E')))),
            li(p('F')),
          ),
        ),
      );
    });

    it('moves directly to previous list item if it was empty', async () => {
      await check(
        doc(
          ol(li(p('nice')), li(p('')), li(p('{<>}text'))),

          p('after'),
        ),
        doc(
          ol(li(p('nice')), li(p('{<>}text'))),

          p('after'),
        ),
      );
    });

    it('moves directly to previous list item if it was empty, but with two paragraphs', async () => {
      await check(
        doc(
          ol(li(p('nice')), li(p('')), li(p('{<>}text'), p('double'))),

          p('after'),
        ),
        doc(
          ol(li(p('nice')), li(p('{<>}text'), p('double'))),

          p('after'),
        ),
      );
    });

    it('backspaces paragraphs within a list item rather than the item itself', async () => {
      await check(
        doc(
          ol(li(p('')), li(p('nice'), p('{<>}two'))),

          p('after'),
        ),
        doc(
          ol(li(p('')), li(p('nice{<>}two'))),

          p('after'),
        ),
      );
    });

    it('backspaces line breaks correctly within list items, with content after', async () => {
      await check(
        doc(
          ol(li(p('')), li(p('nice'), p('two', br(), '{<>}three'))),

          p('after'),
        ),
        doc(
          ol(li(p('')), li(p('nice'), p('two{<>}three'))),

          p('after'),
        ),
      );
    });

    it('backspaces line breaks correctly within list items, with content before', async () => {
      await check(
        doc(
          ol(li(p('')), li(p('nice'), p('two', br(), br(), '{<>}'))),

          p('after'),
        ),
        doc(
          ol(li(p('')), li(p('nice'), p('two', br(), '{<>}'))),

          p('after'),
        ),
      );
    });
  });

  describe('Pressing Shift-Tab', () => {
    const check = async (beforeDoc, afterDoc) => {
      const { editorView } = await testEditor(beforeDoc);
      sendKeyToPm(editorView, 'Shift-Tab');
      expect(editorView.state).toEqualDocAndSelection(afterDoc);
    };

    it('should outdent the list', async () => {
      await check(
        doc(ol(li(p('One'), ul(li(p('Two{<>}')))))),
        doc(ol(li(p('One')), li(p('Two{<>}')))),
      );
    });
  });

  describe('Markdown shortcuts', () => {
    test('-<Space> should create list', async () => {
      const { editorView } = await testEditor(doc(p('first'), p('{<>}')));

      insertText(editorView, '- kj');
      expect(editorView.state).toEqualDocAndSelection(
        doc(p('first'), ul(li(p('kj{<>}')))),
      );
    });
    test('*<Space> should create list', async () => {
      const { editorView } = await testEditor(doc(p('first'), p('{<>}')));

      insertText(editorView, '* kj');
      expect(editorView.state).toEqualDocAndSelection(
        doc(p('first'), ul(li(p('kj{<>}')))),
      );
    });
    test.skip('1.<space> should create ordered list', async () => {
      const { editorView, sel } = await testEditor(doc(p('first{<>}')));
      sendKeyToPm(editorView, 'Enter');
      // insertText(editorView, 'Hi');
      insertText(editorView, '1. k');

      expect(editorView.state).toEqualDocAndSelection(
        doc(p('first'), ol(li(p('k{<>}')))),
      );
    });

    it.skip('should convert to a bullet list item after shift+enter ', async () => {
      const { editorView, sel } = await testEditor(
        doc(p('test', br(), '{<>}')),
      );
      insertText(editorView, '* ', sel);

      expect(editorView.state.doc).toEqualDocument(doc(p('test'), ul(li(p()))));
    });
  });
});
