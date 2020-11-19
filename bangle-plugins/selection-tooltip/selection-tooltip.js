import { Plugin, PluginKey } from 'bangle-core/index';
import { tooltipPlacement } from 'bangle-plugins/tooltip/index';
import { createSelectionTooltipDOM } from './create-selection-tooltip-dom';

export const plugins = selectionTooltip;
export const commands = {
  updateSelectionTooltipType,
  hideSelectionTooltip,
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
};

const LOG = false;

let log = LOG ? console.log.bind(console, 'selection-tooltip') : () => {};

function selectionTooltip({
  key = new PluginKey('selectionTooltipPlugin'),
  calculateType = (state, prevType) => {
    return state.selection.empty ? null : 'default';
  },
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  tooltipDOM,
  tooltipContentDOM,
  tooltipArrow,
  tooltipOffset,
  hideOnBlur = false,
}) {
  if (!tooltipDOM) {
    ({ tooltipDOM, tooltipContentDOM } = createSelectionTooltipDOM(
      tooltipArrow,
    ));
  }

  return [
    selectionTooltipState({
      key: key,
      tooltipDOM,
      tooltipContentDOM,
      calculateType,
    }),
    selectionTooltipController({ tooltipStateKey: key, hideOnBlur }),
    tooltipPlacement.plugins({
      // TODO get rid of this pluginName
      pluginName: 'selectionTooltipPlacement',
      tooltipDOM,
      tooltipStateKey: key,
      tooltipOffset,
      getReferenceElement: getSelectionReferenceElement,
      getScrollContainerDOM,
    }),
  ];
}

function selectionTooltipState({ key, calculateType, tooltipContentDOM }) {
  return new Plugin({
    key,
    state: {
      init: (_, state) => {
        const type = calculateType(state, null);
        return {
          type,
          tooltipContentDOM,
          // For tooltipPlacement plugin
          show: typeof type === 'string',
          // helpers
          calculateType,
        };
      },
      apply: (tr, pluginState) => {
        const meta = tr.getMeta(key);
        if (meta === undefined) {
          return pluginState;
        }

        // Do not change object reference if 'type' was and is null
        if (meta.type == null && pluginState.type == null) {
          return pluginState;
        }

        log('update tooltip state to ', meta.type);
        return {
          ...pluginState,
          type: meta.type,
          show: typeof meta.type === 'string',
        };
      },
    },
  });
}

function selectionTooltipController({ tooltipStateKey, hideOnBlur }) {
  let mouseDown = false;
  return new Plugin({
    props: {
      handleDOMEvents: {
        blur(view, event) {
          if (hideOnBlur) {
            hideSelectionTooltip(tooltipStateKey)(
              view.state,
              view.dispatch,
              view,
            );
          }
        },
        mousedown(view, event) {
          mouseDown = true;
        },
        mouseup(view, event) {
          mouseDown = false;
          return updateTooltipOnSelectionChange(tooltipStateKey)(
            view.state,
            view.dispatch,
            view,
          );
        },
      },
    },
    view() {
      return {
        update(view, lastState) {
          const state = view.state;
          if (mouseDown || lastState === state) {
            return;
          }
          if (
            lastState &&
            lastState.doc.eq(state.doc) &&
            lastState.selection.eq(state.selection)
          ) {
            return;
          }

          return updateTooltipOnSelectionChange(tooltipStateKey)(
            view.state,
            view.dispatch,
            view,
          );
        },
      };
    },
  });
}

function getSelectionReferenceElement(view) {
  return {
    getBoundingClientRect: () => {
      let { head } = view.state.selection;

      const start = view.coordsAtPos(head);
      let { top, bottom, left, right } = start;

      return {
        width: right - left,
        height: bottom - top,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      };
    },
  };
}

export function updateTooltipOnSelectionChange(key) {
  return (state, dispatch, view) => {
    const tooltipState = key.getState(state);
    log('updateTooltipStateOnSelectionChange', tooltipState);
    const newType = tooltipState.calculateType(state, tooltipState.type);
    if (typeof newType === 'string') {
      return updateSelectionTooltipType(key, newType)(state, dispatch, view);
    }

    // Only hide if it is not already hidden
    if (newType == null && tooltipState.type != null) {
      return hideSelectionTooltip(key)(state, dispatch, view);
    }

    return false;
  };
}

/** Commands  */

// This command will rerender if you call it with the type
// it already has. This is done in order to update the position of a tooltip.
export function updateSelectionTooltipType(key, type) {
  return (state, dispatch) => {
    log('updateSelectionTooltipType', type);

    if (dispatch) {
      dispatch(state.tr.setMeta(key, { type }).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function hideSelectionTooltip(key) {
  return (state, dispatch) => {
    log('hideSelectionTooltip');

    if (dispatch) {
      dispatch(
        state.tr.setMeta(key, { type: null }).setMeta('addToHistory', false),
      );
    }
  };
}

export function queryIsSelectionTooltipActive(key) {
  return (state) => {
    const pluginState = key.getState(state);
    return pluginState && typeof pluginState.type === 'string' ? true : false;
  };
}

export function querySelectionTooltipType(key) {
  return (state) => {
    const pluginState = key.getState(state);
    return pluginState && pluginState.type;
  };
}
