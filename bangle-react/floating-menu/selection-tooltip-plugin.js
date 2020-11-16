import { Plugin, PluginKey } from 'prosemirror-state';
import * as tooltipPlacementPlugin from 'bangle-plugins/tooltip-placement/tooltip-placement-plugin';
import { DOMSerializer } from 'prosemirror-model';

const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

export function selectionTooltipPlugin({
  key = new PluginKey('selectionTooltipPlugin'),
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
}) {
  const tooltipStateKey = key;
  const { tooltipContentDOM, tooltipDOM } = createTooltipDOM();

  return [
    selectionTooltipState({
      key: tooltipStateKey,
      tooltipContentDOM,
    }),
    selectionTooltipController({ tooltipStateKey }),
    tooltipPlacementPlugin.plugins({
      // TODO get rid of this pluginName
      pluginName: 'selectionTooltipPlacement',
      tooltipDOM,
      tooltipStateKey,
      tooltipOffset: () => {
        return [0, 0.5 * rem];
      },
      getReferenceElement: getSelectionReferenceElement,
      getScrollContainerDOM,
    }),
  ];
}

function selectionTooltipState({ key, tooltipContentDOM }) {
  return new Plugin({
    key,
    state: {
      init: (_, state) => {
        return {
          tooltipContentDOM,
          show: false,
        };
      },
      apply: (tr, pluginState) => {
        if (tr.getMeta(key) === undefined) {
          return pluginState;
        }

        const showTooltip = tr.getMeta(key);
        // console.log('here', showTooltip);
        // Do not change object reference if 'show' was and is false
        if (showTooltip === false && showTooltip === pluginState.show) {
          console.log('keeping it same');

          return pluginState;
        }
        console.log('updating tooltip');
        return { ...pluginState, show: showTooltip };
      },
    },
  });
}

function selectionTooltipController({ tooltipStateKey }) {
  let mouseDown = false;
  return new Plugin({
    props: {
      handleDOMEvents: {
        blur(view, event) {
          return hideSelectionTooltip(tooltipStateKey)(
            view.state,
            view.dispatch,
            view,
          );
        },
        mousedown(view, event) {
          mouseDown = true;
        },
        mouseup(view, event) {
          mouseDown = false;
          return syncTooltipState(tooltipStateKey)(
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
          let state = view.state;

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

          return syncTooltipState(tooltipStateKey)(
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

function createTooltipDOM(arrow = false) {
  const {
    dom: tooltipDOM,
    contentDOM: tooltipContentDOM,
  } = DOMSerializer.renderSpec(
    window.document,
    [
      'div',
      {
        class: 'bangle-tooltip bangle-selection-tooltip',
        role: 'tooltip',
      },
      [
        'div',
        {
          class: 'bangle-tooltip-content',
        },
        0,
      ],
      arrow && [
        'div',
        {
          'class': 'bangle-tooltip-arrow',
          'data-popper-arrow': '',
        },
      ],
    ].filter(Boolean),
  );

  return { tooltipDOM, tooltipContentDOM };
}

// Calling this command on a tooltip already showing will cause it to rerender i.e. update itself
export function showSelectionTooltip(key) {
  return (state, dispatch) => {
    // We do not check when it is already in show state, to allow for the flexibility
    // of calling showTooltip multiple times as a way to signal updating of any downstream consumers
    // for example a tooltip can update its position
    if (dispatch) {
      dispatch(state.tr.setMeta(key, true).setMeta('addToHistory', false));
    }
    return true;
  };
}

export function hideSelectionTooltip(key) {
  return (state, dispatch) => {
    if (dispatch) {
      dispatch(state.tr.setMeta(key, false).setMeta('addToHistory', false));
    }
  };
}

export function syncTooltipState(key) {
  return (state, dispatch, view) => {
    if (!state.selection.empty) {
      return showSelectionTooltip(key)(state, dispatch, view);
    }

    const tooltipState = key.getState(state);
    if (tooltipState.show) {
      return hideSelectionTooltip(key)(state, dispatch, view);
    }

    return false;
  };
}
