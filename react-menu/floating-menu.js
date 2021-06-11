import {
  queryIsSelectionAroundLink,
  queryIsLinkActive,
} from '@bangle.dev/core/components/link';
import { filter } from '@bangle.dev/core/utils/pm-utils';
import { selectionTooltip } from '@bangle.dev/tooltip';
import { keymap } from '@bangle.dev/core/utils/keymap';
import { PluginKey } from '@bangle.dev/core';
import { rafCommandExec } from '@bangle.dev/core/utils/js-utils';

const {
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
  hideSelectionTooltip,
  updateSelectionTooltipType,
} = selectionTooltip;

export const plugins = floatingMenu;
export const commands = {
  focusFloatingMenuInput,
  toggleLinkSubMenu,
  updateFloatingTooltipType: updateSelectionTooltipType,
  hideFloatingMenu: hideSelectionTooltip,
  queryIsMenuActive: queryIsSelectionTooltipActive,
};
export const defaultKeys = {
  hide: 'Escape',
  toggleLink: 'Meta-k',
};

export const defaultCalculateType = (state, prevType) => {
  if (queryIsSelectionAroundLink()(state) || queryIsLinkActive()(state)) {
    return 'linkSubMenu';
  }
  if (state.selection.empty) {
    return null;
  }
  return 'defaultMenu';
};

function floatingMenu({
  key = new PluginKey('floatingMenuPlugin'),
  keybindings = defaultKeys,
  tooltipRenderOpts = {},
  calculateType = defaultCalculateType,
} = {}) {
  return [
    selectionTooltip.plugins({
      key,
      calculateType,
      tooltipRenderOpts,
    }),
    keybindings &&
      keymap({
        [keybindings.hide]: filter(
          queryIsSelectionTooltipActive(key),
          hideSelectionTooltip(key),
        ),
        [keybindings.toggleLink]: toggleLinkSubMenu(key),
      }),
  ];
}

export function toggleLinkSubMenu(key) {
  return (state, dispatch, view) => {
    const type = querySelectionTooltipType(key)(state);

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === 'linkSubMenu') {
        rafCommandExec(view, focusFloatingMenuInput(key));
      }
      return false;
    }

    if (type === 'linkSubMenu') {
      return hideSelectionTooltip(key)(view.state, view.dispatch, view);
    }

    rafCommandExec(view, focusFloatingMenuInput(key));

    return updateSelectionTooltipType(key, 'linkSubMenu')(
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
