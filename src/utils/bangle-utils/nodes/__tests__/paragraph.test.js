/**
 * @jest-environment jsdom
 */
/** @jsx psx */
import { psx } from '../../../../test-helpers/schema-builders';
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
import { renderTestEditor } from '../../../../test-helpers/render-helper';

import { applyCommand } from '../../../../../src/test-helpers/commands-helpers';

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

import {
  enterKeyCommand,
  splitListItem,
  toggleList,
  backspaceKeyCommand,
} from '../list-item/commands';
import { Blockquote } from '../blockquote';
import { TodoList } from '../todo-list';
import { TodoItem } from '../todo-item';
import { Paragraph } from '../paragraph';

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

const testEditor = renderTestEditor({ extensions, type: 'new' });

describe.only('Basics', () => {
  test.only('is able to type paragraph', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    typeText(editor.view, 'hello');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foohello[]bar</para>
      </doc>,
    );
  });

  test('is able to create a new paragraph', async () => {
    const { editor } = await testEditor(
      <doc>
        <p>foo[]bar</p>
      </doc>,
    );

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

describe('Moving selection start and end', () => {
  const { keys } = new Paragraph().options;
  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('foobar{<>}')));

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('f{<>}oobar')));

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to the start', async () => {
    const { editor } = await testEditor(doc(p('{<>}foobar')));

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(p('{<>}foobar')));
  });

  it('Moves selection to start when inside a list', async () => {
    const { editor } = await testEditor(doc(ul(li(p('foobar{<>}')))));

    sendKeyToPm(editor.view, keys.jumpToStartOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(ul(li(p('{<>}foobar')))));
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(doc(p('{<>}foobar')));

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(p('foobar{<>}')));
  });

  it('Moves selection to the end', async () => {
    const { editor } = await testEditor(doc(p('fooba{<>}r')));

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

    expect(editor.state).toEqualDocAndSelection(doc(p('foobar{<>}')));
  });

  it('Moves selection to end when inside a list', async () => {
    const { editor } = await testEditor(doc(ul(li(p('{<>}foobar')))));

    sendKeyToPm(editor.view, keys.jumpToEndOfLine);

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

describe('Insert empty paragraph above and below', () => {
  test.each(
    // prettier-ignore
    [
      [
        <doc><p>foo[]bar</p></doc>, 
        doc(p('{<>}'), p('foobar'))
      ],
      [
        doc(p('{<>}foobar')), 
        doc(p('{<>}'), p('foobar'))
      ],
      [
        doc(p('{<>}')), 
        doc(p('{<>}'), p())
      ],
      [
        doc(
          p('other paragraph'),
          p('hello{<>}')
        ), 
        doc(
          p('other paragraph'),
          p('{<>}'), 
          p('hello'),
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          p('hello{<>}'),
        ), 
        doc(
          ul(li(p('top'))),
          p('{<>}'), 
          p('hello')
        )
      ]
    ],
  )('Case %# insert above', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Shift-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });

  test.each(
    // prettier-ignore
    [
      [
        <doc><p>foo[]bar</p></doc>, 
        doc(p('foobar'), p('{<>}'))
      ],
      [
        doc(p('{<>}foobar')), 
        doc(p('foobar'), p('{<>}'))
      ],
      [
        doc(p('{<>}')), 
        doc(p(), p('{<>}'))
      ],
      [
        doc(
          p('other paragraph'),
          p('hello{<>}')
        ), 
        doc(
          p('other paragraph'),
          p('hello'),
          p('{<>}'), 
        )
      ],
      [
        doc(
          ul(li(p('top'))),
          p('hello{<>}'),
        ), 
        doc(
          ul(li(p('top'))),
          p('hello'),
          p('{<>}'), 
        )
      ]
    ],
  )('Case %# insert below', async (input, expected) => {
    const { editor } = await testEditor(input);

    sendKeyToPm(editor.view, 'Cmd-Enter');

    expect(editor.state).toEqualDocAndSelection(expected);
  });
});
