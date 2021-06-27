import {
  queryIsSelectionAroundLink,
  queryIsLinkActive,
} from '@bangle.dev/core/components/link';
import { filter } from '@bangle.dev/core/utils/pm-utils';
import { selectionTooltip } from '@bangle.dev/tooltip';
import type { SelectionTooltipProps } from '@bangle.dev/tooltip/selection-tooltip';
import { keymap } from '@bangle.dev/core/utils/keymap';
import { rafCommandExec } from '@bangle.dev/core/utils/utils';
import {
  PluginKey,
  EditorState,
  NodeSelection,
} from '@bangle.dev/core/prosemirror/state';
import { Command } from '@bangle.dev/core/prosemirror/commands';
import { Node } from '@bangle.dev/core/prosemirror/model';

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

export const defaultCalculateType = (
  state: EditorState,
  _prevType: string | null,
) => {
  if (queryIsSelectionAroundLink()(state) || queryIsLinkActive()(state)) {
    return 'linkSubMenu';
  }
  if (state.selection.empty) {
    return null;
  }

  if (state.selection instanceof NodeSelection) {
    return 'defaultMenu';
  }

  const { from, to } = state.selection;
  if (!hasTextBetween(state.doc, from, to)) {
    return null;
  }

  return 'defaultMenu';
};

interface FloatingMenuPluginArgs extends Partial<SelectionTooltipProps> {
  keybindings?: { [index: string]: string };
}

function floatingMenu({
  key = new PluginKey('floatingMenuPlugin'),
  keybindings = defaultKeys,
  tooltipRenderOpts = {},
  calculateType = defaultCalculateType,
}: FloatingMenuPluginArgs = {}) {
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

export function toggleLinkSubMenu(key: PluginKey): Command {
  return (state, _dispatch, view) => {
    const type = querySelectionTooltipType(key)(state);

    if (state.selection.empty) {
      // Focus on link tooltip by keyboard shortcut
      if (type === 'linkSubMenu') {
        rafCommandExec(view!, focusFloatingMenuInput(key));
      }
      return false;
    }

    if (type === 'linkSubMenu') {
      return hideSelectionTooltip(key)(view!.state, view!.dispatch, view);
    }

    rafCommandExec(view!, focusFloatingMenuInput(key));

    return updateSelectionTooltipType(key, 'linkSubMenu')(
      view!.state,
      view!.dispatch,
      view,
    );
  };
}

export function focusFloatingMenuInput(key: PluginKey) {
  return (state: EditorState) => {
    const pluginState = key.getState(state);

    const input = pluginState.tooltipContentDOM.querySelector('input');
    if (!input) {
      return false;
    }
    input.focus();
    return true;
  };
}

function hasTextBetween(doc: Node, from: number, to: number) {
  let found = false;
  doc.nodesBetween(from, to, (node, pos) => {
    if (found) {
      return false;
    }
    if (node.isText) {
      const textStart = pos;
      const textEnd = pos + node.text!.length;
      const noOverlap = from >= textEnd || to <= textStart;
      if (!noOverlap) {
        found = true;
        return false;
      }
    }
  });
  return found;
}
