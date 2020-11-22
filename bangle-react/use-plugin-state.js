import { Plugin, PluginKey } from 'bangle-core/index';
import { useContext, useEffect, useState } from 'react';
import { EditorViewContext } from './ReactEditor';

const LOG = false;
let log = LOG ? console.log.bind(console, 'react/usePluginState') : () => {};

export function usePluginState(pluginKey) {
  const view = useContext(EditorViewContext);
  const [state, setState] = useState(pluginKey.getState(view.state));

  useEffect(() => {
    log('Setup plugin', pluginKey);
    const plugin = new Plugin({
      key: new PluginKey(`withPluginState_${pluginKey.key}`),
      view() {
        return {
          update(view, prevState) {
            const { state } = view;
            if (prevState === state) {
              return;
            }
            const newPluginState = pluginKey.getState(state);

            if (newPluginState !== pluginKey.getState(prevState)) {
              setState(newPluginState);
            }
          },
        };
      },
    });
    view._updatePluginWatcher(plugin);
    return () => {
      log('removing plugin', pluginKey);
      view._updatePluginWatcher(plugin, true);
    };
  }, [view, pluginKey]);

  return state;
}
