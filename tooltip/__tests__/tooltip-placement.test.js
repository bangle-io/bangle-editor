/**
 * @jest-environment jsdom
 */

/** @jsx psx */
import { psx } from '@bangle.dev/core/test-helpers/test-helpers';
import { createPopper } from '@popperjs/core/lib/popper-lite';
import { defaultPlugins } from '@bangle.dev/core/test-helpers/default-components';
import { SpecRegistry } from '@bangle.dev/core/spec-registry';
import {
  BangleEditor,
  BangleEditorState,
  Plugin,
  PluginKey,
} from '@bangle.dev/core';

import { createTooltipDOM } from '../create-tooltip-dom';
import { tooltipPlacement } from '../index';
import { coreSpec } from '@bangle.dev/core/utils/core-components';

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

const setupTooltipPlugin = ({ stateKey, renderOpts }) => {
  return [
    tooltipPlacement.plugins({
      stateKey,
      renderOpts: {
        tooltipDOM: document.createElement('div'),
        getScrollContainer: () => {
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
        ...renderOpts,
      },
    }),
  ];
};

const setupEditorState = (plugin) => {
  const specRegistry = new SpecRegistry(coreSpec());
  const plugins = () => [...defaultPlugins(), plugin];

  // console.log(plugins())

  return new BangleEditorState({
    specRegistry,
    plugins,
    initialValue: (<doc>
      <para>hello world</para>
    </doc>)(specRegistry.schema),
  });
};

const setupEditorView = ({
  state,
  viewDOM = document.createElement('div'),
}) => {
  return new BangleEditor(viewDOM, { state }).view;
};

const stateKey = new PluginKey('tooltipState');

describe('plugin view', () => {
  test('passed options correctly', async () => {
    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: true },
    });
    const tooltipDOMSpec = createTooltipDOM();
    const { dom: tooltipDOM } = tooltipDOMSpec;

    const referenceElement = jest.fn();
    const getReferenceElement = jest.fn(() => referenceElement);
    const scrollContainerDOM = document.createElement('div');
    const plugin = setupTooltipPlugin({
      stateKey: stateKey,
      renderOpts: {
        tooltipDOMSpec,
        fallbackPlacements: ['pos-a', 'pos-b'],
        getReferenceElement,
        getScrollContainer: () => scrollContainerDOM,
        placement: 'test-placement',
        tooltipOffset: () => 'test_offset',
      },
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

  test('Mounts', async () => {
    let mockPopperInstance;

    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: { show: false },
    });

    const onUpdateTooltip = jest.fn(function () {
      mockPopperInstance = this.popperInstance;
    });
    const onHideTooltip = jest.fn();
    const tooltipDOMSpec = createTooltipDOM();
    const { dom: tooltipDOM } = tooltipDOMSpec;
    const viewDOM = document.createElement('div');
    const plugin = setupTooltipPlugin({
      stateKey: stateKey,
      renderOpts: {
        onUpdateTooltip,
        onHideTooltip,
        tooltipDOMSpec,
      },
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
    const tooltipDOMSpec = createTooltipDOM();
    const { dom: tooltipDOM } = tooltipDOMSpec;
    const onHideTooltip = jest.fn();
    const plugin = setupTooltipPlugin({
      stateKey,
      renderOpts: {
        onUpdateTooltip,
        onHideTooltip,
        tooltipDOMSpec,
      },
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
    const tooltipDOMSpec = createTooltipDOM();
    const { dom: tooltipDOM } = tooltipDOMSpec;
    const onHideTooltip = jest.fn();
    const plugin = setupTooltipPlugin({
      stateKey: stateKey,
      renderOpts: { onUpdateTooltip, onHideTooltip, tooltipDOMSpec },
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

  it('throws error if stateKeys plugin has no show field', async () => {
    const statePlugin = setupStatePlugin({
      key: stateKey,
      initialState: {},
    });

    const onHideTooltip = jest.fn();

    const plugin = setupTooltipPlugin({
      stateKey,
      renderOpts: {
        onHideTooltip,
      },
    });

    const viewDOM = document.createElement('div');

    expect(() =>
      setupEditorView({
        state: setupEditorState([statePlugin, plugin]),
        viewDOM,
      }),
    ).toThrowError(`"show" field required.`);
  });
});
