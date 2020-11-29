import * as pmHistory from 'prosemirror-history';
import { bangleKeymap } from 'bangle-core/utils/keymap';
import { PluginGroup } from 'bangle-core/pm-plugin';

export const plugins = pluginsFactory;
export const commands = {
  undo,
  redo,
};
export const defaultKeys = {
  undo: 'Mod-z',
  redo: 'Mod-y Shift-Mod-z',
};

const name = 'history';

function pluginsFactory({ historyOpts = {}, keybindings = defaultKeys } = {}) {
  return () => {
    return new PluginGroup(name, [
      pmHistory.history(historyOpts),
      keybindings &&
        bangleKeymap({
          [keybindings.undo]: undo(),
          [keybindings.redo]: redo(),
        }),
    ]);
  };
}

export function undo() {
  return pmHistory.undo;
}
export function redo() {
  return pmHistory.redo;
}
