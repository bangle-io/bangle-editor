import { Plugin, PluginKey } from '@bangle.dev/core/index';
import { NodeSelection } from '@bangle.dev/core/prosemirror/state';
import { createTooltipDOM } from './create-tooltip-dom';
import * as tooltipPlacement from './tooltip-placement';

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
  tooltipRenderOpts = {},
}) {
  return () => {
    // - We are creating tooltipDOMSpec inside the callback because if we create outside
    //   it might get reused by multiple view instances if the caller of
    //   selectionTooltip is not careful and does not make a new selectionTooltip() call.
    //   Though this doesn't mitigate the risk of caller using real
    //   dom instances in the `tooltipRenderOpts.tooltipDOMSpec`.
    // - We are converting to DOM elements so that their instances
    //   can be shared across plugins.
    const tooltipDOMSpec = createTooltipDOM(tooltipRenderOpts.tooltipDOMSpec);
    return [
      selectionTooltipState({
        key: key,
        tooltipDOMSpec,
        calculateType,
      }),
      selectionTooltipController({ stateKey: key }),
      tooltipPlacement.plugins({
        stateKey: key,
        renderOpts: {
          getReferenceElement: getSelectionReferenceElement,
          ...tooltipRenderOpts,
          tooltipDOMSpec,
        },
      }),
    ];
  };
}

function selectionTooltipState({ key, calculateType, tooltipDOMSpec }) {
  return new Plugin({
    key,
    state: {
      init: (_, state) => {
        const type = calculateType(state, null);
        return {
          type,
          tooltipContentDOM: tooltipDOMSpec.contentDOM,
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

function selectionTooltipController({ stateKey }) {
  let mouseDown = false;
  return new Plugin({
    props: {
      handleDOMEvents: {
        mousedown(view, event) {
          mouseDown = true;
          return false;
        },
        mouseup(view, event) {
          mouseDown = false;
          _syncTooltipOnUpdate(stateKey)(view.state, view.dispatch, view);
          return false;
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

          return _syncTooltipOnUpdate(stateKey)(
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
      const { selection } = view.state;
      let { head, from } = selection;
      // since head is dependent on the users choice of direction,
      // it is not always equal to `from`.
      // For textSelections we want to show the tooltip at head of the
      // selection.
      // But for NodeSelection we always want `from` since, if we go with `head`
      // coordsAtPos(head) might get the position `to` in head, resulting in
      // incorrectly getting position of the node after the selected Node.
      const pos = selection instanceof NodeSelection ? from : head;

      const start = view.coordsAtPos(pos);
      let { top, bottom, left, right } = start;
      let width = right - left;

      // Not sure why, but coordsAtPos does not return the correct
      // width of the element, so doing this to override it.
      if (selection instanceof NodeSelection) {
        const domNode = view.nodeDOM(pos);
        width = domNode ? domNode.clientWidth : width;
        // if (domNode) {
        //   return domNode.getBoundingClientRect();
        // }
      }

      return {
        width,
        height: bottom - top,
        top: top,
        right: right,
        bottom: bottom,
        left: left,
      };
    },
  };
}

export function _syncTooltipOnUpdate(key) {
  return (state, dispatch, view) => {
    const tooltipState = key.getState(state);
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
    return true;
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
