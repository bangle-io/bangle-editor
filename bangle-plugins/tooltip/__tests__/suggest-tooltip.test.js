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

import { typeChar } from 'bangle-core/test-helpers/index';
import { PluginKey, Selection } from 'prosemirror-state';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { sleep } from 'bangle-core/utils/js-utils';
import { suggestTooltip } from '../index';
// We are using char code to differentiate between different schema
// 47 is char code for '/'
const suggestTriggerMarkSlash = (content) => (
  <suggest_slash trigger="/">{content}</suggest_slash>
);

describe('suggest basic show and hide', () => {
  let suggestionKey = new PluginKey(),
    testEditor;

  const specSheet = new SpecSheet([
    ...coreSpec(),
    suggestTooltip.spec({ markName: 'suggest_slash', trigger: '/' }),
  ]);
  const plugins = [
    ...corePlugins(),
    suggestTooltip.plugins({
      key: suggestionKey,
      markName: 'suggest_slash',
      trigger: '/',
    }),
  ];
  const getTooltipState = (state) => {
    return suggestionKey.getState(state);
  };

  beforeEach(async () => {
    testEditor = renderTestEditor({ specSheet, plugins });
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

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(false);
    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );
    expect(view.state.doc.toString()).toMatchSnapshot();

    expect(getTooltipState(view.state)).toEqual({
      markName: 'suggest_slash',
      show: true,
      trigger: '/',
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
      markName: 'suggest_slash',
      trigger: '/',
    });
  });

  test('trigger on an empty doc', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(false);

    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
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
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foobar {suggestTriggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });

    // Give dom time to settle, as popper state updates as not sync
    await sleep(5);
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
      markName: 'suggest_slash',
      trigger: '/',
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
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
      markName: 'suggest_slash',
      trigger: '/',
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
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

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'second',
    );

    let tr = view.state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(7))));
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'first',
    );
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

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      longText,
    );
  });

  test('Typing trigger text slowly', async () => {
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

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );
  });

  test.skip('When forward deleting the mark the tooltip hides', async () => {
    const { view } = await testEditor(
      <doc>
        <para>hello[]</para>
      </doc>,
    );

    // typeChar(view, '/');
    // typeText(view, 'check');
    // expect(suggestionsTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state)).toBe(true);

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
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
  });
});

describe('keybindings test', () => {
  let testEditor;
  let suggestionKey = new PluginKey();

  const opts = {
    key: suggestionKey,
    markName: 'suggest_slash',
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

  const specSheet = new SpecSheet([
    ...coreSpec(),
    suggestTooltip.spec({ markName: 'suggest_slash', trigger: '/' }),
  ]);
  const plugins = [...corePlugins(), suggestTooltip.plugins(opts)];

  test('calls on* callbacks correctly', async () => {
    testEditor = renderTestEditor({ specSheet, plugins });
    const { view } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );
    // since it is called many times
    expect(opts.onUpdateTooltip).toBeCalled();
    expect(opts.onHideTooltip).toBeCalledTimes(0);
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);

    sendKeyToPm(view, 'Escape');
    expect(opts.onEscape).toBeCalledTimes(1);
    sendKeyToPm(view, 'Enter');
    expect(opts.onEnter).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowUp');
    expect(opts.onArrowUp).toBeCalledTimes(1);
    sendKeyToPm(view, 'ArrowDown');
    expect(opts.onArrowDown).toBeCalledTimes(1);

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestionKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestionKey)(view.state)).toBe(
      'check',
    );

    // Outside the mark
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)));
    // TODO for some mysterious reason this is called twice with the same state
    expect(opts.onHideTooltip).toBeCalledTimes(1);
  });
});

test.todo(
  'Check with differen trigger inline-suggest and that they dont interfere with each other',
);
