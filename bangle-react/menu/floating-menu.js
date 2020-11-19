import {
  isSelectionAroundLink,
  isSelectionInsideLink,
} from 'bangle-core/components/link';
import { filter } from 'bangle-core/utils/pm-utils';
import { selectionTooltip } from 'bangle-plugins/tooltip/index';
import {
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
  hideSelectionTooltip,
  updateSelectionTooltipType,
} from 'bangle-plugins/tooltip/selection-tooltip';
import { keymap } from 'prosemirror-keymap';
import { PluginKey } from 'bangle-core/index';

export const plugins = floatingMenu;
export const commands = {
  focusFloatingMenuInput,
  toggleFloatingLinkMenu,
  updateFloatingTooltipType: updateSelectionTooltipType,
  hideFloatingMenu: hideSelectionTooltip,
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
        [keybindings.toggleLink]: toggleFloatingLinkMenu(key),
      }),
  ];
}

export function toggleFloatingLinkMenu(key) {
  return (state, dispatch, view) => {
    const type = querySelectionTooltipType(key)(state);

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === 'floatingLinkMenu') {
        requestAnimationFrame(() =>
          focusFloatingMenuInput(key)(state, dispatch, view),
        );
      }
      return false;
    }

    if (type === 'floatingLinkMenu') {
      return hideSelectionTooltip(key)(view.state, view.dispatch, view);
    }

    requestAnimationFrame(() =>
      focusFloatingMenuInput(key)(state, dispatch, view),
    );

    return updateSelectionTooltipType(key, 'floatingLinkMenu')(
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
