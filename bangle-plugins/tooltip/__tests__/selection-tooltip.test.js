/**
 * @jest-environment jsdom
 */

/** @jsx psx */

import {
  psx,
  typeText,
  renderTestEditor,
} from 'bangle-core/test-helpers/index';

import { selectionTooltip } from '../index';
import { defaultPlugins } from 'bangle-core/test-helpers/default-components';
import { EditorState, PluginKey, TextSelection } from 'prosemirror-state';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { createTooltipDOM } from '../index';
import { _syncTooltipOnUpdate } from '../selection-tooltip';

describe('selection-tooltip', () => {
  let testEditor, specSheet, tooltipDOMSpec;
  let key = new PluginKey('selection_tooltip');
  beforeEach(() => {
    tooltipDOMSpec = createTooltipDOM();
    tooltipDOMSpec.contentDOM.textContent = 'hello world';

    specSheet = new SpecSheet();

    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        tooltipRenderOpts: { tooltipDOMSpec },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });
  });

  test('Correctly adds tooltip', async () => {
    const calculateType = jest.fn(() => 'default');
    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        calculateType,
        tooltipRenderOpts: { tooltipDOMSpec },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );
    view.hasFocus = () => true;
    expect(key.getState(view.state)).toMatchObject({
      show: true,
    });
    expect(calculateType).toBeCalled();

    expect(view.dom.parentNode).toMatchInlineSnapshot(`
      <div
        data-testid="test-editor"
      >
        <div
          class="ProseMirror bangle-editor content"
          contenteditable="true"
        >
          <p>
            foobar
          </p>
        </div>
        <div
          class="bangle-tooltip"
          data-popper-placement="top"
          data-show=""
          role="tooltip"
          style="position: absolute; left: 0px; top: 0px; margin: 0px; bottom: 0px; transform: translate(0px, 0px);"
        >
          <div
            class="bangle-tooltip-content"
          >
            hello world
          </div>
        </div>
      </div>
    `);
  });

  test('Has the correct state', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );

    expect(view.dom.parentNode.contains(tooltipDOMSpec.dom)).toBe(true);
    expect(tooltipDOMSpec.dom.hasAttribute('data-show')).toBe(true);
    expect(key.getState(view.state)).toEqual({
      type: 'default',
      tooltipContentDOM: tooltipDOMSpec.contentDOM,
      show: true,
      calculateType: expect.any(Function),
    });
  });

  test('No tooltip if no selection', async () => {
    const { view } = await testEditor(
      <doc>
        <para>foobar</para>
      </doc>,
    );

    expect(view.dom.parentNode.contains(tooltipDOMSpec.dom)).toBe(true);
    expect(tooltipDOMSpec.dom.hasAttribute('data-show')).toBe(false);
  });

  test('On typing hide tooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>[foo]bar</para>
      </doc>,
    );

    expect(tooltipDOMSpec.dom.hasAttribute('data-show')).toBe(true);

    typeText(view, 'hello');
    expect(tooltipDOMSpec.dom.hasAttribute('data-show')).toBe(false);
  });

  test('Creating a selection should show tooltip, set type and  call calculateType', async () => {
    const calculateType = jest.fn((state, prevPluginState) => {
      return state.selection.empty ? null : 'test';
    });
    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        calculateType,
        tooltipRenderOpts: {
          tooltipDOMSpec,
        },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(calculateType).nthCalledWith(1, expect.any(EditorState), null);

    expect(key.getState(view.state)).toMatchObject({
      show: false,
    });

    expect(calculateType).toBeCalledTimes(3);
    let selection = TextSelection.create(view.state.doc, 3, 5);
    view.dispatch(view.state.tr.setSelection(selection));

    expect(calculateType).toBeCalledTimes(4);
    expect(key.getState(view.state)).toMatchObject({
      show: true,
      type: 'test',
    });

    // empty selection
    selection = TextSelection.create(view.state.doc, 3, 3);
    view.dispatch(view.state.tr.setSelection(selection));
    expect(calculateType).toBeCalledTimes(5);
    expect(key.getState(view.state)).toMatchObject({
      show: false,
      type: null,
    });
  });
});

describe('commands', () => {
  let testEditor, tooltipDOMSpec, specSheet;
  let key = new PluginKey('selection_tooltip');
  beforeEach(() => {
    tooltipDOMSpec = createTooltipDOM();

    tooltipDOMSpec.contentDOM.textContent = 'hello world';

    specSheet = new SpecSheet();

    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        tooltipRenderOpts: {
          tooltipDOMSpec,
        },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });
  });
  test('updateSelectionTooltipType should not trigger calculateType', async () => {
    const calculateType = jest.fn((state, prevPluginState) => {
      return state.selection.empty ? null : 'test';
    });
    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        calculateType,
        tooltipRenderOpts: {
          tooltipDOMSpec,
        },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(calculateType).toBeCalledTimes(3);
    selectionTooltip.updateSelectionTooltipType(key, 'new_type')(
      view.state,
      view.dispatch,
      view,
    );
    expect(calculateType).toBeCalledTimes(3);
    expect(key.getState(view.state)).toMatchObject({
      show: true,
      type: 'new_type',
    });
  });

  test('updateSelectionTooltipType should create new instance of plugin state', async () => {
    const calculateType = jest.fn((state, prevPluginState) => {
      return state.selection.empty ? null : 'test';
    });
    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        calculateType,
        tooltipRenderOpts: {
          tooltipDOMSpec,
        },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(calculateType).toBeCalledTimes(3);
    selectionTooltip.updateSelectionTooltipType(key, 'new_type')(
      view.state,
      view.dispatch,
      view,
    );

    const stateBefore = key.getState(view.state);

    selectionTooltip.updateSelectionTooltipType(key, 'new_type')(
      view.state,
      view.dispatch,
      view,
    );

    const stateAfter = key.getState(view.state);

    // This allows for rerendering of the tooltip position
    expect(stateBefore).not.toBe(stateAfter);
    expect(stateBefore).toEqual(stateAfter);
  });

  test('hideSelectionTooltip', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(key.getState(view.state)).toMatchObject({
      show: true,
      type: 'default',
    });

    selectionTooltip.hideSelectionTooltip(key)(view.state, view.dispatch, view);

    const stateBefore = key.getState(view.state);

    expect(stateBefore).toMatchObject({
      show: false,
      type: null,
    });

    // Send hide again to test of plugin state reference is preerved
    selectionTooltip.hideSelectionTooltip(key)(view.state, view.dispatch, view);

    const stateAfter = key.getState(view.state);

    expect(stateBefore).toBe(stateAfter);
  });

  test("updateTooltipOnSelectionChange doesn't dispatch if already hidden", async () => {
    const calculateType = jest.fn((state, prevPluginState) => {
      return state.selection.empty ? null : 'test';
    });
    const plugins = [
      ...defaultPlugins(),
      selectionTooltip.plugins({
        key,
        calculateType,
        tooltipRenderOpts: {
          tooltipDOMSpec,
        },
      }),
    ];

    testEditor = renderTestEditor({ specSheet, plugins });

    const { view } = await testEditor(
      <doc>
        <para>foo[]bar</para>
      </doc>,
    );

    expect(key.getState(view.state)).toMatchObject({
      show: false,
      type: null,
    });

    expect(_syncTooltipOnUpdate(key)(view.state, view.dispatch, view)).toBe(
      false,
    );
  });

  test('querySelectionTooltipType', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(selectionTooltip.querySelectionTooltipType(key)(view.state)).toBe(
      'default',
    );
  });

  test('queryIsTooltipActive', async () => {
    const { view } = await testEditor(
      <doc>
        <para>f[oo]bar</para>
      </doc>,
    );

    expect(
      selectionTooltip.queryIsSelectionTooltipActive(key)(view.state),
    ).toBe(true);
  });
});
