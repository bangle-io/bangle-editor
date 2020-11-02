/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor2,
} from 'bangle-core/test-helpers/index';

import { typeChar } from 'bangle-core/test-helpers/index';
import { PluginKey, Selection } from 'prosemirror-state';
import { inlineSuggest } from '../index';
import { corePlugins, coreSpec } from 'bangle-core/components';

// We are using char code to differentiate between different schema
// 47 is char code for '/'
const triggerMarkSlash = (content) => (
  <inline_suggest_slash trigger="/">{content}</inline_suggest_slash>
);

describe('inline suggest basic show and hide', () => {
  let suggestionKey = new PluginKey(),
    testEditor;

  const editorSpec = [
    ...coreSpec(),
    inlineSuggest.spec({ markName: 'inline_suggest_slash', trigger: '/' }),
  ];
  const plugins = [
    ...corePlugins(),
    inlineSuggest.plugins({
      key: suggestionKey,
      markName: 'inline_suggest_slash',
      trigger: '/',
    }),
  ];
  const getTooltipState = (state) => {
    return inlineSuggest.getTooltipKey(suggestionKey).getState(state);
  };

  beforeEach(async () => {
    testEditor = renderTestEditor2({ editorSpec, plugins });
  });

  test('when no trigger', async () => {
    const { view } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(view.dom.parentNode).toMatchSnapshot();
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
    const { view } = await testEditor(input);

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(
      false,
    );
    typeChar(view, '/');
    typeText(view, 'check');
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');
    expect(view.state.doc.toString()).toMatchSnapshot();

    expect(getTooltipState(view.state)).toEqual({
      show: true,
    });
  });

  test('Not allowed in codeblock', async () => {
    const { view } = await testEditor(
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello []</codeBlock>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <ul>
          <li>
            <para>top</para>
          </li>
        </ul>
        <codeBlock>hello /check[]</codeBlock>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      show: false,
    });
  });

  test('trigger on an empty doc', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(
      false,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{triggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      show: true,
    });
  });

  test('types a trigger', async () => {
    const { view } = await testEditor(
      <doc>
        <para>foobar []</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foobar {triggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      show: true,
    });

    expect(view.dom.parentNode).toMatchSnapshot();
  });

  test('Selection going to other location hides the tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, '');
    const { state } = view;

    // Outside the mark
    view.dispatch(state.tr.setSelection(Selection.atEnd(state.doc)));

    expect(getTooltipState(view.state)).toEqual({
      show: false,
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      show: true,
    });
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
  });

  test('Selection going to other location hides the tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, '');
    const { state } = view;

    // Outside the mark
    view.dispatch(state.tr.setSelection(Selection.atEnd(state.doc)));

    expect(getTooltipState(view.state)).toEqual({
      show: false,
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      show: true,
    });
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
  });

  test('Query at end of document', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'first');

    // Outside the mark
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)));

    typeText(view, ' ');
    typeChar(view, '/');
    typeText(view, 'second');

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe(
      'second',
    );

    let tr = view.state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(7))));
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('first');
  });

  test('Really long query', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    const longText =
      'firstfirstfirstfirst firstfirstfirstfirstfirst firstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirst firstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirstfirst';
    typeChar(view, '/');
    typeText(view, longText);

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe(
      longText,
    );
  });

  test('Typing query slowly', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'c');
    typeText(view, 'h');
    typeText(view, 'e');
    typeText(view, 'c');
    typeText(view, 'k');

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');
  });

  test.skip('When forward deleting the mark the tooltip hides', async () => {
    const { view } = await testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    // typeChar(view, '/');
    // typeText(view, 'check');
    // expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);

    // view.dispatch(view.state.tr.delete(1, 2));

    // view.dispatch(
    //   view.state.tr.setSelection(Selection.atStart(view.state.doc)),
    // );

    sendKeyToPm(view, 'Z');
    // sendKeyToPm(view, 'Backspace');
    // sendKeyToPm(view, 'Backspace');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>hello</para>
      </doc>,
    );
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
  });
});

describe('keybindings test', () => {
  let testEditor;
  let suggestionKey = new PluginKey();

  const opts = {
    key: suggestionKey,
    markName: 'inline_suggest_slash',
    trigger: '/',
    placement: 'bottom-start',
    enterKeyName: 'Enter',
    arrowUpKeyName: 'ArrowUp',
    arrowDownKeyName: 'ArrowDown',
    escapeKeyName: 'Escape',
    // Use another key to mimic enter behaviour for example, Tab for entering
    alternateEnterKeyName: undefined,

    onUpdateTooltip: jest.fn(() => true),
    onHideTooltip: jest.fn(() => true),
    onEnter: jest.fn(() => true),
    onArrowDown: jest.fn(() => true),
    onArrowUp: jest.fn(() => true),
    onEscape: jest.fn(() => true),
  };

  const editorSpec = [
    ...coreSpec(),
    inlineSuggest.spec({ markName: 'inline_suggest_slash', trigger: '/' }),
  ];
  const plugins = [...corePlugins(), inlineSuggest.plugins(opts)];

  test('calls on* callbacks correctly', async () => {
    testEditor = renderTestEditor2({ editorSpec, plugins });
    const { view } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{triggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );
    // since it is called many times
    expect(opts.onUpdateTooltip).toBeCalled();
    expect(opts.onHideTooltip).toBeCalledTimes(0);
    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);

    sendKeyToPm(view, 'Escape');
    expect(opts.onEscape).toBeCalledTimes(1);
    sendKeyToPm(view, 'Enter');
    expect(opts.onEnter).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowUp');
    expect(opts.onArrowUp).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowDown');
    expect(opts.onArrowDown).toBeCalledTimes(1);

    expect(inlineSuggest.isTooltipActive(suggestionKey)(view.state)).toBe(true);
    expect(inlineSuggest.getQueryText(suggestionKey)(view.state)).toBe('check');

    // Outside the mark
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)));
    // TODO for some mysterious reason this is called twice with the same state
    expect(opts.onHideTooltip).toBeCalledTimes(1);
  });
});

test.todo(
  'Check with differen trigger inline-suggest and that they dont interfere with each other',
);
