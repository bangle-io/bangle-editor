/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor,
} from 'bangle-core/test-helpers/index';

import {
  Blockquote,
  BulletList,
  CodeBlock,
  HardBreak,
  Heading,
  ListItem,
  OrderedList,
  TodoItem,
  TodoList,
} from 'bangle-core/nodes/index';
import { InlineSuggest } from '../inline-suggest';
import { sleep } from 'bangle-core/utils/js-utils';
import { typeChar } from 'bangle-core/test-helpers/index';
import { Selection } from 'prosemirror-state';
import { Italic, Underline } from 'bangle-core/marks/index';

// We are using char code to differentiate between different schema
// 47 is char code for '/'
const triggerMarkSlash = (content) => (
  <inline_suggest_c47 trigger="/">{content}</inline_suggest_c47>
);

test.todo('the query long enough to be on two lines');

test.todo('query on an empty document');

test.todo('query at the end of document');

test.todo('at the start / end of a list');
test.todo('at the start / end of other blocks');

describe('inline suggest', () => {
  let suggestionExtension, testEditor;
  const getTooltipState = (state) => {
    return suggestionExtension.tooltipPluginKey.getState(state);
  };

  beforeEach(async () => {
    suggestionExtension = new InlineSuggest({
      trigger: '/',
    });

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
      new Italic(),
      suggestionExtension,
    ];
    testEditor = renderTestEditor({ extensions });
  });

  test('when no trigger', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(editor.view.dom.parentNode).toMatchSnapshot();
  });

  test.each([
    <doc>
      <para>[]</para>
    </doc>,
    <doc>
      <para>hello []</para>
    </doc>,
    <doc>
      <para>hello</para>
      <para>hello</para>
      <para>hello []</para>
    </doc>,
    <doc>
      <ul>
        <li>
          <para>hello []</para>
        </li>
      </ul>
    </doc>,
    <doc>
      <todoList>
        <todoItem>
          <para>hello []</para>
        </todoItem>
      </todoList>
    </doc>,
    <doc>
      <ol>
        <li>
          <para>hello []</para>
        </li>
      </ol>
    </doc>,
    <doc>
      <blockquote>
        <heading>hello []</heading>
      </blockquote>
    </doc>,
    <doc>
      <blockquote>
        <heading>hello</heading>
      </blockquote>
      <para>[]</para>
    </doc>,
  ])('Case %# different parent block', async (input) => {
    const { editor } = await testEditor(input);

    typeChar(editor.view, '/');
    typeText(editor.view, 'check');

    expect(editor.state.doc.toString()).toMatchSnapshot();

    expect(getTooltipState(editor.state)).toEqual({
      show: true,
    });
  });

  test('Not allowed in codeblock', async () => {
    const { editor } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello []</codeBlock>
      </doc>,
    );

    typeChar(editor.view, '/');
    typeText(editor.view, 'check');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello /check[]</codeBlock>
      </doc>,
    );

    expect(getTooltipState(editor.state)).toEqual({
      show: false,
    });
  });

  test('trigger on an empty doc', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    typeChar(editor.view, '/');
    typeText(editor.view, 'check');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>{triggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(editor.state)).toEqual({
      show: true,
    });
  });

  test('types a trigger', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>foobar []</para>
      </doc>,
    );

    typeChar(editor.view, '/');
    typeText(editor.view, 'check');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>foobar {triggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(editor.state)).toEqual({
      show: true,
    });

    expect(editor.view.dom.parentNode).toMatchSnapshot();
  });

  test('Selection change show and hide the tooltip', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(editor.view, '/');
    typeText(editor.view, '');
    const { state } = editor.view;

    // Outside the mark
    editor.view.dispatch(state.tr.setSelection(Selection.atEnd(state.doc)));

    expect(getTooltipState(editor.state)).toEqual({
      show: false,
    });

    let tr = state.tr;

    // Inside the mark
    editor.view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));

    expect(getTooltipState(editor.state)).toEqual({
      show: true,
    });
  });
});
