/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  renderTestEditor,
  sendKeyToPm,
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
import { typeChar } from 'bangle-core/test-helpers/index';
import { Selection } from 'prosemirror-state';
import { Italic, Underline } from 'bangle-core/marks/index';

// We are using char code to differentiate between different schema
// 47 is char code for '/'
const triggerMarkSlash = (content) => (
  <inline_suggest_c47 trigger="/">{content}</inline_suggest_c47>
);

describe('inline suggest basic show and hide', () => {
  let suggestionExtension, testEditor;
  const getTooltipState = (state) => {
    return suggestionExtension.getTooltipPluginKey().getState(state);
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

    expect(suggestionExtension.isActive(editor.state)).toBe(false);
    typeChar(editor.view, '/');
    typeText(editor.view, 'check');
    expect(suggestionExtension.isActive(editor.state)).toBe(true);
    expect(suggestionExtension.getQueryText(editor.state)).toBe('check');
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

    expect(suggestionExtension.isActive(editor.state)).toBe(false);

    typeChar(editor.view, '/');
    typeText(editor.view, 'check');
    expect(suggestionExtension.isActive(editor.state)).toBe(true);
    expect(suggestionExtension.getQueryText(editor.state)).toBe('check');

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
    expect(suggestionExtension.getQueryText(editor.state)).toBe('check');

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

  test('Selection going to other location hides the tooltip', async () => {
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
    expect(suggestionExtension.isActive(editor.state)).toBe(true);
  });

  test('Selection going to other location hides the tooltip', async () => {
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
    expect(suggestionExtension.isActive(editor.state)).toBe(true);
  });

  test('Query at end of document', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(editor.view, '/');
    typeText(editor.view, 'first');
    const view = editor.view;

    // Outside the mark
    editor.view.dispatch(
      view.state.tr.setSelection(Selection.atEnd(view.state.doc)),
    );

    typeText(editor.view, ' ');
    typeChar(editor.view, '/');
    typeText(editor.view, 'second');

    expect(suggestionExtension.isActive(view.state)).toBe(true);
    expect(suggestionExtension.getQueryText(view.state)).toBe('second');

    let tr = view.state.tr;

    // Inside the mark
    editor.view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(7))));
    expect(suggestionExtension.isActive(view.state)).toBe(true);
    expect(suggestionExtension.getQueryText(view.state)).toBe('first');
  });

  test('Really long query', async () => {
    const { editor } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    const longText =
      'firstfirstfirstfirst firstfirstfirstfirstfirst firstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirst firstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirst';
    typeChar(editor.view, '/');
    typeText(editor.view, longText);

    const view = editor.view;
    expect(suggestionExtension.isActive(view.state)).toBe(true);
    expect(suggestionExtension.getQueryText(view.state)).toBe(longText);
  });
});

describe('keybindings test', () => {
  let suggestionExtension, testEditor;

  const opts = {
    trigger: '/',
    placement: 'bottom-start',
    enterKeyName: 'Enter',
    arrowUpKeyName: 'ArrowUp',
    arrowDownKeyName: 'ArrowDown',
    escapeKeyName: 'Escape',
    // Use another key to mimic enter behaviour for example, Tab for entering
    alternateEnterKeyName: undefined,

    onUpdate: jest.fn(() => true),
    onDestroy: jest.fn(() => true),
    onEnter: jest.fn(() => true),
    onArrowDown: jest.fn(() => true),
    onArrowUp: jest.fn(() => true),
    onEscape: jest.fn(() => true),
  };

  test('calls on* callbacks correctly', async () => {
    suggestionExtension = new InlineSuggest(opts);

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
    const { editor } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    const view = editor.view;
    typeChar(view, '/');
    typeText(view, 'check');
    expect(suggestionExtension.isActive(view.state)).toBe(true);
    expect(suggestionExtension.getQueryText(editor.state)).toBe('check');

    expect(editor.state).toEqualDocAndSelection(
      <doc>
        <para>{triggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );
    // since it is called many times
    expect(opts.onUpdate).toBeCalled();
    expect(opts.onDestroy).toBeCalledTimes(0);
    expect(suggestionExtension.isActive(editor.state)).toBe(true);

    sendKeyToPm(view, 'Escape');
    expect(opts.onEscape).toBeCalledTimes(1);
    sendKeyToPm(view, 'Enter');
    expect(opts.onEnter).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowUp');
    expect(opts.onArrowUp).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowDown');
    expect(opts.onArrowDown).toBeCalledTimes(1);

    expect(suggestionExtension.isActive(view.state)).toBe(true);
    expect(suggestionExtension.getQueryText(editor.state)).toBe('check');

    // Outside the mark
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)));
    // TODO for some mysterious reason this is called twice with the same state
    expect(opts.onDestroy).toBeCalledTimes(2);
  });
});
