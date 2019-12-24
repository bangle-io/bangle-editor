import { keymap } from 'prosemirror-keymap';

import { typeAheadStatePluginKey } from './type-ahead-state-plugin';
import { DOWN, UP, ENTER } from './actions';
import { removeTypeAheadMark } from './commands';

export function typeaheadKeymap() {
  const handler = (action) => (state, dispatch) => {
    const pluginState = typeAheadStatePluginKey.getState(state);
    if (!pluginState || !pluginState.active) {
      return false;
    }
    if (dispatch) {
      dispatch(state.tr.setMeta(typeAheadStatePluginKey, { action }));
    }
    return true;
  };

  return keymap({
    Enter: handler(ENTER),
    ArrowDown: handler(DOWN),
    ArrowUp: handler(UP),
  });
}
