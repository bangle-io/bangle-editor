import {
  isSelectionAroundLink,
  isSelectionInsideLink,
} from 'bangle-core/components/link';
import { filter } from 'bangle-core/utils/pm-utils';
import { selectionTooltip } from 'bangle-plugins/selection-tooltip/index';
import {
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
  hideSelectionTooltip,
  updateSelectionTooltipType,
} from 'bangle-plugins/selection-tooltip/selection-tooltip';
import { keymap } from 'prosemirror-keymap';
import { PluginKey } from 'prosemirror-state';

export const plugins = floatingMenu;
export const commands = {
  focusFloatingMenuInput,
  toggleLinkMenu,
};

export const defaultKeys = {
  hide: 'Escape',
  toggleLink: 'Meta-k',
};

const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);

function floatingMenu({
  key = new PluginKey('floatingMenuPlugin'),
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  calculateType = (state, prevType) => {
    if (isSelectionAroundLink(state) || isSelectionInsideLink(state)) {
      return 'floatingLinkMenu';
    }
    if (state.selection.empty) {
      return null;
    }
    if (prevType === 'floatingLinkMenu') {
      return prevType;
    }
    return 'floatingMenu';
  },
  keybindings = defaultKeys,
  tooltipArrow = false,
  tooltipOffset = () => {
    return [0, 0.5 * rem];
  },
}) {
  return [
    selectionTooltip.plugins({
      key,
      getScrollContainerDOM,
      calculateType,
      tooltipArrow,
      tooltipOffset,
    }),
    keybindings &&
      keymap({
        [keybindings.hide]: filter(
          queryIsSelectionTooltipActive(key),
          hideSelectionTooltip(key),
        ),
        [keybindings.toggleLink]: toggleLinkMenu(key),
      }),
  ];
}

export function toggleLinkMenu(tooltipStateKey) {
  return (state, dispatch, view) => {
    const type = querySelectionTooltipType(tooltipStateKey)(state);

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === 'floatingLinkMenu') {
        requestAnimationFrame(() =>
          focusFloatingMenuInput(tooltipStateKey)(state, dispatch, view),
        );
      }
      return false;
    }

    if (type === 'floatingLinkMenu') {
      return hideSelectionTooltip(tooltipStateKey)(
        view.state,
        view.dispatch,
        view,
      );
    }

    requestAnimationFrame(() =>
      focusFloatingMenuInput(tooltipStateKey)(state, dispatch, view),
    );

    return updateSelectionTooltipType(tooltipStateKey, 'floatingLinkMenu')(
      view.state,
      view.dispatch,
      view,
    );
  };
}

export function focusFloatingMenuInput(key) {
  return (state) => {
    const pluginState = key.getState(state);

    const input = pluginState.tooltipContentDOM.querySelector('input');
    if (!input) {
      return false;
    }
    input.focus();
    return true;
  };
}
