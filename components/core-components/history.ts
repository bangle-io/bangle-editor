import type { RawPlugins } from '@bangle.dev/core';
import { PluginGroup } from '@bangle.dev/core';
import * as pmHistory from '@bangle.dev/pm';
import { keymap } from '@bangle.dev/pm';

export const plugins = pluginsFactory;
export const commands = {
  undo,
  redo,
};
export const defaultKeys = {
  undo: 'Mod-z',
  redo: 'Mod-y',
  redoAlt: 'Shift-Mod-z',
};

const name = 'history';

function pluginsFactory({
  historyOpts = {},
  keybindings = defaultKeys,
} = {}): RawPlugins {
  return () => {
    return new PluginGroup(name, [
      pmHistory.history(historyOpts),
      keybindings &&
        keymap({
          [keybindings.undo]: undo(),
          [keybindings.redo]: redo(),
          [keybindings.redoAlt]: redo(),
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
