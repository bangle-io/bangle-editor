/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';

import { EditorState } from 'prosemirror-state';
import { tooltipPlacementPlugin } from '../tooltip-placement-plugin';
import { Editor as PMEditor, editorStateSetup } from 'bangle-core/editor';
import { hideTooltip, showTooltip } from '../tooltip-commands';
import { EditorView } from 'prosemirror-view';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { schemaLoader } from 'bangle-core/element-loaders';

jest.mock('@popperjs/core/lib/popper-lite', () => {
  return {
    createPopper: jest.fn(() => ({
      update: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});

const setupPlugin = (opts = {}) => {
  const plugin = tooltipPlacementPlugin({
    tooltipDOM: document.createElement('div'),
    getScrollContainerDOM: () => {
      return document.createElement('div');
    },
    getReferenceElement: () => {
      return {
        getBoundingClientRect: () => {
          return {
            width: 0,
            height: 0,
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          };
        },
      };
    },
    ...opts,
  });
  return plugin;
};

const setupEditorState = (plugin) => {
  const editorSpec = [...coreSpec()];
  const plugins = [...corePlugins(), plugin];

  return editorStateSetup({
    plugins,
    editorSpec,
    doc: (<doc>
      <para>hello world</para>
    </doc>)(schemaLoader(editorSpec)),
  });
};

const setupEditorView = ({
  state,
  viewDOM = document.createElement('div'),
}) => {
  return new EditorView(viewDOM, {
    state,
  });
};

describe('Tooltip state', () => {
  test('Default is state false', async () => {
    const plugin = setupPlugin();
    let state = setupEditorState(plugin);

    expect(plugin.getState(state)).toMatchInlineSnapshot(`
      Object {
        "show": false,
      }
    `);
  });

  test('Obeys initial showState', async () => {
    const plugin = setupPlugin({
      getInitialShowState: () => true,
    });
    let state = setupEditorState(plugin);

    expect(plugin.getState(state)).toMatchInlineSnapshot(`
      Object {
        "show": true,
      }
    `);
  });

  test('hideTooltip command works', async () => {
    const plugin = setupPlugin({
      getInitialShowState: () => true,
    });
    let state = setupEditorState(plugin);

    expect(plugin.getState(state).show).toBe(true);

    hideTooltip(plugin)(state, (tr) => {
      state = state.apply(tr);
    });

    expect(plugin.getState(state).show).toBe(false);
  });

  test("hideTooltip doesn't dispatch if already hidden", async () => {
    const plugin = setupPlugin({});
    let state = setupEditorState(plugin);

    const dispatch = jest.fn((tr) => {
      state = state.apply(tr);
    });

    hideTooltip(plugin)(state, dispatch);

    expect(dispatch).toBeCalledTimes(0);
    expect(plugin.getState(state).show).toBe(false);
  });

  test('showTooltip command works', async () => {
    const plugin = setupPlugin({
      getInitialShowState: () => false,
    });
    let state = setupEditorState(plugin);

    showTooltip(plugin)(state, (tr) => {
      state = state.apply(tr);
    });

    expect(plugin.getState(state).show).toBe(true);
  });

  test('showTooltip command creates new state even if already showing', async () => {
    const plugin = setupPlugin({
      getInitialShowState: () => true,
    });

    let state = setupEditorState(plugin);

    const pluginState = plugin.getState(state);
    expect(pluginState).toMatchInlineSnapshot(`
      Object {
        "show": true,
      }
    `);

    showTooltip(plugin)(state, (tr) => {
      state = state.apply(tr);
    });
    expect(pluginState).toEqual(plugin.getState(state));
    expect(pluginState).not.toBe(plugin.getState(state));
  });
});

describe('plugin view', () => {
  test('passed options correctly', async () => {
    const tooltipDOM = document.createElement('div');
    const referenceElement = jest.fn();
    const getReferenceElement = jest.fn(() => referenceElement);
    const scrollContainerDOM = document.createElement('div');
    const plugin = setupPlugin({
      fallbackPlacements: ['pos-a', 'pos-b'],
      getInitialShowState: (state) => true,
      getReferenceElement,
      getScrollContainerDOM: () => scrollContainerDOM,
      placement: 'test-placement',
      tooltipDOM,
    });
    const view = setupEditorView({ state: setupEditorState(plugin) });

    expect(createPopper).toBeCalledTimes(1);
    expect(createPopper).nthCalledWith(1, referenceElement, tooltipDOM, {
      placement: 'test-placement',
      modifiers: expect.any(Array),
    });

    expect(createPopper.mock.calls[0][2].modifiers).toMatchSnapshot();
    expect(getReferenceElement).toBeCalledTimes(1);
    expect(getReferenceElement).nthCalledWith(
      1,
      view,
      tooltipDOM,
      scrollContainerDOM,
    );
  });

  test('Mounts ', async () => {
    let mockPopperInstance;
    const onUpdateTooltip = jest.fn(function () {
      mockPopperInstance = this.popperInstance;
    });
    const onHideTooltip = jest.fn();
    const tooltipDOM = document.createElement('div');
    const viewDOM = document.createElement('div');
    const plugin = setupPlugin({
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });
    const view = setupEditorView({ state: setupEditorState(plugin), viewDOM });

    expect(plugin.getState(view.state).show).toBe(false);

    expect(createPopper).toBeCalledTimes(0);
    expect(viewDOM.contains(tooltipDOM)).toBe(true);

    showTooltip(plugin)(view.state, view.dispatch);

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    expect(plugin.getState(view.state).show).toBe(true);

    expect(createPopper).toBeCalledTimes(1);
    expect(mockPopperInstance.update).toBeCalledTimes(1);
    // one for creating popper and one for showing
    // i know its redundant but its not expected for this
    // callback to be pure
    expect(onUpdateTooltip).toBeCalledTimes(2);
    expect(onUpdateTooltip).nthCalledWith(1, view.state, view.dispatch, view);
    expect(onUpdateTooltip).nthCalledWith(2, view.state, view.dispatch, view);
    expect(onHideTooltip).toBeCalledTimes(0);
  });

  test('hide tooltip', async () => {
    let mockPopperInstance;
    const onUpdateTooltip = jest.fn(function () {
      mockPopperInstance = this.popperInstance;
    });
    const tooltipDOM = document.createElement('div');

    const onHideTooltip = jest.fn();
    const plugin = setupPlugin({
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });
    const view = setupEditorView({ state: setupEditorState(plugin) });

    expect(plugin.getState(view.state).show).toBe(false);

    expect(createPopper).toBeCalledTimes(0);
    showTooltip(plugin)(view.state, view.dispatch);
    expect(plugin.getState(view.state).show).toBe(true);
    expect(mockPopperInstance.destroy).toBeCalledTimes(0);
    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    hideTooltip(plugin)(view.state, view.dispatch);

    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);

    expect(onHideTooltip).toBeCalledTimes(1);
    expect(onHideTooltip).nthCalledWith(1, view.state, view.dispatch, view);
    expect(mockPopperInstance.destroy).toBeCalledTimes(1);
  });

  test('view destroy', async () => {
    const onUpdateTooltip = jest.fn(function () {});
    const tooltipDOM = document.createElement('div');

    const onHideTooltip = jest.fn();
    const plugin = setupPlugin({
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });

    const viewDOM = document.createElement('div');

    const view = setupEditorView({ state: setupEditorState(plugin), viewDOM });

    expect(plugin.getState(view.state).show).toBe(false);

    showTooltip(plugin)(view.state, view.dispatch);

    view.destroy();

    expect(viewDOM.contains(tooltipDOM)).toBe(false);
  });
});
