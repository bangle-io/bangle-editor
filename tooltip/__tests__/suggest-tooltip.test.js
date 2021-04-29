/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  sendKeyToPm,
  renderTestEditor,
  typeChar,
} from '@bangle.dev/core/test-helpers/test-helpers';
import {
  defaultPlugins,
  defaultSpecs,
} from '@bangle.dev/core/test-helpers/default-components';

import { PluginKey, Selection } from '@bangle.dev/core/prosemirror/state';
import { SpecRegistry } from '@bangle.dev/core/spec-registry';
import { sleep } from '@bangle.dev/core/utils/js-utils';
import { suggestTooltip } from '../index';
import { replaceSuggestMarkWith } from '../suggest-tooltip';
// We are using char code to differentiate between different schema
// 47 is char code for '/'
const suggestTriggerMarkSlash = (content) => (
  <suggest_slash trigger="/">{content}</suggest_slash>
);
let suggestKey = new PluginKey();
const getTooltipState = (state) => {
  return suggestKey.getState(state);
};

describe('suggest basic show and hide', () => {
  let testEditor;

  const specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    suggestTooltip.spec({ markName: 'suggest_slash', trigger: '/' }),
  ]);
  const plugins = [
    ...defaultPlugins(),
    suggestTooltip.plugins({
      key: suggestKey,
      markName: 'suggest_slash',
      trigger: '/',
    }),
  ];

  beforeEach(async () => {
    testEditor = renderTestEditor({ specRegistry, plugins });
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
      <bulletList>
        <listItem todoChecked={false}>
          <para>hello []</para>
        </listItem>
      </bulletList>
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(false);
    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );
    expect(view.state.doc.toString()).toMatchSnapshot();

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: 'check',
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
      counter: 0,
      triggerText: '',
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(false);

    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: 'check',
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
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>foobar {suggestTriggerMarkSlash('/check')}[]</para>
      </doc>,
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: 'check',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });

    // Give dom time to settle, as popper state updates as not sync
    await sleep(5);
    expect(view.dom.parentNode).toMatchSnapshot();
  });

  test('Selection at start going to other location hides the tooltip 1', async () => {
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
      counter: 0,
      triggerText: '',
      show: false,
      markName: 'suggest_slash',
      trigger: '/',
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: '',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
  });

  test('Selection at start going to other location hides the tooltip 2', async () => {
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
      counter: 0,
      triggerText: '',
      show: false,
      markName: 'suggest_slash',
      trigger: '/',
    });

    let tr = state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(2))));
    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: '',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'second',
    );

    let tr = view.state.tr;

    // Inside the mark
    view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(7))));
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );
  });
  test('Increment, reset & decrement of counter', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'first');

    suggestTooltip.incrementSuggestTooltipCounter(suggestKey)(
      view.state,
      view.dispatch,
      view,
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: 1,
      triggerText: 'first',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });

    suggestTooltip.resetSuggestTooltipCounter(suggestKey)(
      view.state,
      view.dispatch,
      view,
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: 'first',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });

    suggestTooltip.decrementSuggestTooltipCounter(suggestKey)(
      view.state,
      view.dispatch,
      view,
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: -1,
      triggerText: 'first',
      show: true,
      markName: 'suggest_slash',
      trigger: '/',
    });
  });

  test('Moving cursor before the trigger should hide the tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[]</para>
      </doc>,
    );
    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    view.dispatch(
      view.state.tr.setSelection(Selection.atStart(view.state.doc)),
    );

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: '',
      show: false,
      markName: 'suggest_slash',
      trigger: '/',
    });
  });
  test('When user deletes the trigger, hide the tooltip and remove the mark', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');

    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    view.dispatch(view.state.tr.delete(1, 2));

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>check hello</para>
      </doc>,
    );
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(false);
  });
});

describe('keybindings test', () => {
  let testEditor;
  const specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    suggestTooltip.spec({ markName: 'suggest_slash', trigger: '/' }),
  ]);

  test('calls on* callbacks correctly', async () => {
    const opts = {
      key: suggestKey,
      markName: 'suggest_slash',
      trigger: '/',
      tooltipRenderOpts: {
        onUpdateTooltip: jest.fn(() => true),
        onHideTooltip: jest.fn(() => true),
        placement: 'bottom-start',
      },

      onEnter: jest.fn(() => true),
      onArrowDown: jest.fn(() => true),
      onArrowUp: jest.fn(() => true),
      onEscape: jest.fn(() => true),
    };

    const plugins = [...defaultPlugins(), suggestTooltip.plugins(opts)];
    testEditor = renderTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );
    // since it is called many times
    expect(opts.tooltipRenderOpts.onUpdateTooltip).toBeCalled();
    expect(opts.tooltipRenderOpts.onHideTooltip).toBeCalledTimes(0);
    expect(
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
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
      suggestTooltip.queryIsSuggestTooltipActive(suggestKey)(view.state),
    ).toBe(true);
    expect(suggestTooltip.queryTriggerText(suggestKey)(view.state)).toBe(
      'check',
    );

    // Outside the mark
    view.dispatch(view.state.tr.setSelection(Selection.atEnd(view.state.doc)));
    // TODO for some mysterious reason this is called twice with the same state
    expect(opts.tooltipRenderOpts.onHideTooltip).toBeCalledTimes(1);
  });

  test('pressing enter works removes the mark', async () => {
    const opts = {
      key: suggestKey,
      markName: 'suggest_slash',
      trigger: '/',
    };

    const plugins = [...defaultPlugins(), suggestTooltip.plugins(opts)];
    testEditor = renderTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );

    sendKeyToPm(view, 'Enter');

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: '',
      show: false,
      markName: 'suggest_slash',
      trigger: '/',
    });

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>/check[] foobar</para>
      </doc>,
    );
  });

  test('pressing escape removes the mark', async () => {
    const opts = {
      key: suggestKey,
      markName: 'suggest_slash',
      trigger: '/',
      tooltipRenderOpts: {
        placement: 'bottom-start',
      },
    };

    const plugins = [...defaultPlugins(), suggestTooltip.plugins(opts)];
    testEditor = renderTestEditor({ specRegistry, plugins });
    const { view } = await testEditor(
      <doc>
        <para>[] foobar</para>
      </doc>,
    );

    typeChar(view, '/');
    typeText(view, 'check');
    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>{suggestTriggerMarkSlash('/check')}[] foobar</para>
      </doc>,
    );

    sendKeyToPm(view, 'Escape');

    expect(getTooltipState(view.state)).toEqual({
      counter: 0,
      triggerText: '',
      show: false,
      markName: 'suggest_slash',
      trigger: '/',
    });

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>/check[] foobar</para>
      </doc>,
    );
  });
});

describe('replaceSuggestMarkWith', () => {
  let testEditor;

  const specRegistry = new SpecRegistry([
    ...defaultSpecs(),
    suggestTooltip.spec({ markName: 'suggest_slash', trigger: '/' }),
  ]);
  const plugins = [
    ...defaultPlugins(),
    suggestTooltip.plugins({
      key: suggestKey,
      markName: 'suggest_slash',
      trigger: '/',
    }),
  ];

  beforeEach(async () => {
    testEditor = renderTestEditor({ specRegistry, plugins });
  });

  test('replaces with textnode', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );
    view.focus = jest.fn();

    typeChar(view, '/');
    typeText(view, 'check');

    replaceSuggestMarkWith(suggestKey, view.state.schema.text('replacement'))(
      view.state,
      view.dispatch,
      view,
    );

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>replacement[] hello</para>
      </doc>,
    );
    expect(view.focus).toBeCalledTimes(1);
  });

  test('replaces with hard break', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[] hello</para>
      </doc>,
    );
    view.focus = jest.fn();

    typeChar(view, '/');
    typeText(view, 'check');

    replaceSuggestMarkWith(
      suggestKey,
      view.state.schema.nodes.hardBreak.createChecked(),
    )(view.state, view.dispatch, view);

    expect(view.state).toEqualDocAndSelection(
      <doc>
        <para>
          <br /> [] hello
        </para>
      </doc>,
    );
    expect(view.focus).toBeCalledTimes(1);
  });
});

test.todo(
  'Check with differen trigger inline-suggest and that they dont interfere with each other',
);
