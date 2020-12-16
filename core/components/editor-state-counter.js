import { Plugin, PluginKey, PluginGroup } from '@banglejs/core/plugin';

const name = 'editorStateCounter';
export const plugins = pluginsFactory;
export const key = new PluginKey(name);

function pluginsFactory() {
  return () => {
    return new PluginGroup(name, [
      new Plugin({
        key,
        state: {
          init(_, state) {
            return 0;
          },
          apply(tr, pluginState, oldState, newState) {
            return tr.docChanged ? pluginState + 1 : pluginState;
          },
        },
      }),
    ]);
  };
}
