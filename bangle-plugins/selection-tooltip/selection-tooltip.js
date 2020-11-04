import { keymap } from 'prosemirror-keymap';
import { trackMousePlugin } from './track-mouse-plugin';
import {
  showTooltip,
  hideTooltip,
  makeHideTooltipTr,
  tooltipPlacement,
} from 'bangle-plugins/tooltip-placement/index';
import { filter } from 'bangle-core/utils/pm-utils';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { Plugin, PluginKey } from 'prosemirror-state';
const LOG = false;
let log = LOG ? console.log.bind(console, 'plugins/tooltip') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  isTooltipActive: isSelectionTooltipActive,
  hideSelectionTooltip,
  showSelectionTooltip,
  hideAllSelectionTooltip,
};

const name = 'selection_tooltip';
const keyStore = pluginKeyStore();

const getTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, parentKey.key + '__tooltip');
};
const createTooltipKey = (parentKey) => {
  return keyStore.create(parentKey, parentKey.key + '__tooltip');
};

function specFactory(opts = {}) {
  return {
    type: 'component',
    name,
  };
}

const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
const HIDE_ALL_SELECTION_TOOLTIP = 'HIDE_ALL_SELECTION_TOOLTIP';

function pluginsFactory({
  key = new PluginKey('selectionTooltip'),
  tooltipName = 'selection',
  tooltipDOM,
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  tooltipOffset = () => {
    return [0, 0.5 * rem];
  },
  getReferenceElement = getSelectionReferenceElement,
  shouldShowTooltip = (state) => {
    return !state.selection.empty;
  },
  getInitialShowState = (state) => false,

  placement,

  // key bindings
  enterKeyName = 'Enter',
  arrowUpKeyName = 'ArrowUp',
  arrowDownKeyName = 'ArrowDown',
  escapeKeyName = 'Escape',
  alternateEnterKeyName,

  onHideTooltip = () => {},

  onUpdateTooltip = () => {},

  onEnter = (state, dispatch, view) => {
    return false;
  },
  onArrowDown = (state, dispatch, view) => {
    return false;
  },
  onArrowUp = (state, dispatch, view) => {
    return false;
  },
  // TODO this is added in the plugin
  onEscape = undefined,
} = {}) {
  const tooltipKey = createTooltipKey(key);
  const plugin = tooltipPlacement.plugins({
    key: tooltipKey,
    pluginName: tooltipName,
    tooltipOffset: tooltipOffset,
    tooltipDOM: tooltipDOM,
    getScrollContainerDOM: getScrollContainerDOM,
    getReferenceElement: getReferenceElement,
    onUpdateTooltip: onUpdateTooltip,
    getInitialShowState: getInitialShowState,
    onHideTooltip: onHideTooltip,
    placement,
  });

  if (!onEscape) {
    onEscape = hideSelectionTooltip(key);
  }

  const isActiveCheck = isSelectionTooltipActive(key);

  const keys = {
    [enterKeyName]: filter(isActiveCheck, onEnter),
    [arrowUpKeyName]: filter(isActiveCheck, onArrowUp),
    [arrowDownKeyName]: filter(isActiveCheck, onArrowDown),
    [escapeKeyName]: filter(isActiveCheck, onEscape),
  };
  if (alternateEnterKeyName) {
    keys[alternateEnterKeyName] = keys[enterKeyName];
  }

  return [
    plugin,
    trackMousePlugin({
      tooltipDOM: tooltipDOM,
      tooltipPlugin: plugin,
      shouldShowTooltip,
    }).plugin,
    keymap(keys),
    new Plugin({
      appendTransaction(trs, oldState, newState) {
        if (trs.some((tr) => tr.getMeta(HIDE_ALL_SELECTION_TOOLTIP))) {
          return makeHideTooltipTr(newState.tr, tooltipKey);
        }
      },
    }),
  ];
}

export function createTooltipDOM(arrow = false) {
  const tooltipDOM = document.createElement('div');
  tooltipDOM.className = 'bangle-tooltip bangle-selection-tooltip';
  tooltipDOM.setAttribute('role', 'tooltip');

  const tooltipContent = document.createElement('div');
  tooltipContent.className = 'bangle-tooltip-content';
  tooltipDOM.appendChild(tooltipContent);
  if (arrow) {
    const arrowDOM = document.createElement('div');
    arrowDOM.className = 'bangle-tooltip-arrow';
    arrowDOM.setAttribute('data-popper-arrow', '');
    tooltipDOM.appendChild(arrowDOM);
  }
  return { tooltipDOM, tooltipContent };
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

/**
 * Commands
 */

/**
 * Shows a tooltip when there is a selection
 */
export function isSelectionTooltipActive(key) {
  return (state) => {
    return getTooltipKey(key).getState(state)?.show;
  };
}

export function hideSelectionTooltip(key) {
  return hideTooltip(getTooltipKey(key));
}

export function showSelectionTooltip(key) {
  return showTooltip(getTooltipKey(key));
}

export function hideAllSelectionTooltip() {
  return (state, dispatch) => {
    dispatch(state.tr.setMeta(HIDE_ALL_SELECTION_TOOLTIP, true));
    return true;
  };
}
