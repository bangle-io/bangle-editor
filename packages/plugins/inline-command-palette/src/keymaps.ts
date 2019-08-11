import { keymap } from 'prosemirror-keymap';
import { Plugin, EditorState } from 'prosemirror-state';

import { dismissCommand } from './commands';
import { StatePlugin2Key } from './state-plugin';

export function keymapPlugin(): Plugin {
  return keymap({
    Enter: (state, dispatch) => {
      const pluginState = StatePlugin2Key.getState(state);
      if (!pluginState || !pluginState.active) {
        return false;
      }
      return dismissCommand()(state, dispatch);
    },
  });
}

export default keymapPlugin;
