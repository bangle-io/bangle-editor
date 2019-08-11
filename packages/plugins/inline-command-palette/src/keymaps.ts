import { keymap } from 'prosemirror-keymap';
import { Plugin, EditorState } from 'prosemirror-state';

import { removeTypeAheadMark } from './commands';
import { StatePlugin2Key } from './state-plugin';
import { DOWN, UP } from './actions';

export function keymapPlugin(): Plugin {
  return keymap({
    Enter: (state, dispatch) => {
      const pluginState = StatePlugin2Key.getState(state);
      if (!pluginState || !pluginState.active) {
        return false;
      }
      return removeTypeAheadMark()(state, dispatch);
    },
    ArrowDown: (state, dispatch) => {
      const pluginState = StatePlugin2Key.getState(state);
      if (!pluginState || !pluginState.active) {
        return false;
      }
      if (dispatch)
        dispatch(state.tr.setMeta(StatePlugin2Key, { action: DOWN }));
      return true;
    },
    ArrowUp: (state, dispatch) => {
      const pluginState = StatePlugin2Key.getState(state);
      if (!pluginState || !pluginState.active) {
        return false;
      }
      if (dispatch) dispatch(state.tr.setMeta(StatePlugin2Key, { action: UP }));
      return true;
    },
  });
}

export default keymapPlugin;
