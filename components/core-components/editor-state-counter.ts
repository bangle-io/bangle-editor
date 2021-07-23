import { Plugin, PluginKey } from '@bangle.dev/pm';
import type { RawPlugins } from '@bangle.dev/core';
import { PluginGroup } from '@bangle.dev/core';

const name = 'editorStateCounter';
export const plugins = pluginsFactory;
export const docChangedKey = new PluginKey(name);
export const selectionChangedKey = new PluginKey(name);

function pluginsFactory(): RawPlugins {
  return () => {
    return new PluginGroup(name, [
      new Plugin({
        key: docChangedKey,
        state: {
          init(_, _state) {
            return 0;
          },
          apply(tr, pluginState, _oldState, _newState) {
            return tr.docChanged ? pluginState + 1 : pluginState;
          },
        },
      }),
      new Plugin({
        key: selectionChangedKey,
        state: {
          init(_, _state) {
            return 0;
          },
          apply(_tr, pluginState, oldState, newState) {
            return newState.selection.eq(oldState && oldState.selection)
              ? pluginState
              : pluginState + 1;
          },
        },
      }),
    ]);
  };
}
