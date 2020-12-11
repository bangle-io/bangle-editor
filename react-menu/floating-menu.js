import {
  queryIsSelectionAroundLink,
  queryIsLinkActive,
} from '@banglejs/core/components/link';
import { filter } from '@banglejs/core/utils/pm-utils';
import { selectionTooltip } from '@banglejs/tooltip/index';
import {
  queryIsSelectionTooltipActive,
  querySelectionTooltipType,
  hideSelectionTooltip,
  updateSelectionTooltipType,
} from '@banglejs/tooltip/selection-tooltip';
import { keymap } from '@banglejs/core/utils/keymap';
import { PluginKey } from '@banglejs/core/index';
import { rafCommandExec } from '@banglejs/core/utils/js-utils';

export const plugins = floatingMenu;
export const commands = {
  focusFloatingMenuInput,
  toggleFloatingLinkMenu,
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
    return 'floatingLinkMenu';
  }
  if (state.selection.empty) {
    return null;
  }
  return 'floatingMenu';
};
function floatingMenu({
  key = new PluginKey('floatingMenuPlugin'),
  tooltipRenderOpts = {},
  keybindings = defaultKeys,
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
        rafCommandExec(view, focusFloatingMenuInput(key));
      }
      return false;
    }

    if (type === 'floatingLinkMenu') {
      return hideSelectionTooltip(key)(view.state, view.dispatch, view);
    }

    rafCommandExec(view, focusFloatingMenuInput(key));

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
