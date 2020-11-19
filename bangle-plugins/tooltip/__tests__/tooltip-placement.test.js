/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from 'bangle-core/test-helpers/index';

import { editorStateSetup } from 'bangle-core/editor';
import { EditorView } from 'prosemirror-view';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import { corePlugins, coreSpec } from 'bangle-core/components';
import { tooltipPlacement } from '../index';
import { SpecSheet } from 'bangle-core/spec-sheet';
import { Plugin, PluginKey } from 'bangle-core/index';

jest.mock('@popperjs/core/lib/popper-lite', () => {
  return {
    createPopper: jest.fn(() => ({
      update: jest.fn(),
      destroy: jest.fn(),
    })),
  };
});

const updateTooltipState = (key, value) => (state, dispatch) => {
  if (dispatch) {
    dispatch(state.tr.setMeta(key, value).setMeta('addToHistory', false));
  }
  return true;
};

const setupStatePlugin = ({ key, initialState = { show: false } }) => {
  return new Plugin({
    key,
    state: {
      init: () => {
        return initialState;
      },
      apply: (tr, pluginState) => {
        const meta = tr.getMeta(key);
        if (!meta) {
          return pluginState;
        }
        return meta;
      },
    },
  });
};

const setupTooltipPlugin = (opts = {}) => {
  return [
    tooltipPlacement.plugins({
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
    }),
  ];
};

const setupEditorState = (plugin) => {
  const specSheet = new SpecSheet([...coreSpec()]);
  const plugins = [...corePlugins(), plugin];

  return editorStateSetup({
    plugins,
    specSheet,
    doc: (<doc>
      <para>hello world</para>
    </doc>)(specSheet.schema),
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

const stateKey = new PluginKey('tooltipState');

describe('plugin view', () => {
  test('passed options correctly', async () => {
    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: true },
    });
    const tooltipDOM = document.createElement('div');

    const referenceElement = jest.fn();
    const getReferenceElement = jest.fn(() => referenceElement);
    const scrollContainerDOM = document.createElement('div');
    const plugin = setupTooltipPlugin({
      tooltipDOM,
      tooltipStateKey: stateKey,
      fallbackPlacements: ['pos-a', 'pos-b'],
      getReferenceElement,
      getScrollContainerDOM: () => scrollContainerDOM,
      placement: 'test-placement',
      tooltipOffset: () => 'test_offset',
    });
    const view = setupEditorView({
      state: setupEditorState([statePlugin, plugin]),
    });

    expect(createPopper).toBeCalledTimes(1);
    expect(createPopper).nthCalledWith(1, referenceElement, tooltipDOM, {
      placement: 'test-placement',
      modifiers: expect.any(Array),
    });

    expect(
      createPopper.mock.calls[0][2].modifiers
        .find((r) => r.name === 'offset' && r.options && r.options.offset)
        .options.offset(),
    ).toMatchInlineSnapshot(`"test_offset"`);
    expect(
      createPopper.mock.calls[0][2].modifiers.find(
        (r) => r.name === 'preventOverflow' && r.options && r.options.boundary,
      ).options.boundary,
    ).toBe(scrollContainerDOM);

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

    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: false },
    });

    const onUpdateTooltip = jest.fn(function () {
      mockPopperInstance = this.popperInstance;
    });
    const onHideTooltip = jest.fn();
    const tooltipDOM = document.createElement('div');
    const viewDOM = document.createElement('div');
    const plugin = setupTooltipPlugin({
      tooltipStateKey: stateKey,
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });
    const view = setupEditorView({
      state: setupEditorState([statePlugin, plugin]),
      viewDOM,
    });

    expect(createPopper).toBeCalledTimes(0);
    expect(viewDOM.contains(tooltipDOM)).toBe(true);

    updateTooltipState(stateKey, { show: true })(
      view.state,
      view.dispatch,
      view,
    );

    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

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

    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: false },
    });

    const onUpdateTooltip = jest.fn(function () {
      mockPopperInstance = this.popperInstance;
    });
    const tooltipDOM = document.createElement('div');

    const onHideTooltip = jest.fn();
    const plugin = setupTooltipPlugin({
      tooltipStateKey: stateKey,
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });
    const view = setupEditorView({
      state: setupEditorState([statePlugin, plugin]),
    });

    expect(createPopper).toBeCalledTimes(0);

    updateTooltipState(stateKey, { show: true })(
      view.state,
      view.dispatch,
      view,
    );
    expect(mockPopperInstance.destroy).toBeCalledTimes(0);
    expect(tooltipDOM.hasAttribute('data-show')).toBe(true);

    updateTooltipState(stateKey, { show: false })(
      view.state,
      view.dispatch,
      view,
    );
    expect(tooltipDOM.hasAttribute('data-show')).toBe(false);

    expect(onHideTooltip).toBeCalledTimes(1);
    expect(onHideTooltip).nthCalledWith(1, view.state, view.dispatch, view);
    expect(mockPopperInstance.destroy).toBeCalledTimes(1);
  });

  test('view destroy', async () => {
    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: false },
    });

    const onUpdateTooltip = jest.fn(function () {});
    const tooltipDOM = document.createElement('div');

    const onHideTooltip = jest.fn();
    const plugin = setupTooltipPlugin({
      tooltipStateKey: stateKey,
      onUpdateTooltip,
      onHideTooltip,
      tooltipDOM,
    });

    const viewDOM = document.createElement('div');

    const view = setupEditorView({
      state: setupEditorState([statePlugin, plugin]),
      viewDOM,
    });

    updateTooltipState(stateKey, { show: true })(
      view.state,
      view.dispatch,
      view,
    );

    view.destroy();

    expect(viewDOM.contains(tooltipDOM)).toBe(false);
  });
});
