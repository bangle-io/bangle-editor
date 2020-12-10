import { useState, useContext, useEffect } from 'react';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { BangleEditorState, Plugin, PluginKey } from '@banglejs/core/index';
import { corePlugins } from '@banglejs/core/utils/core-components';
import { EditorViewContext } from './ReactEditor';

const LOG = false;
let log = LOG ? console.log.bind(console, 'react/usePluginState') : () => {};

export function useEditorState(props) {
  if (props.plugins && typeof props.plugins !== 'function') {
    throw new Error('plugins error: plugins must be a function');
  }

  const [state] = useState(
    () =>
      // Instantiate the editorState once and keep using that instance
      // on subsequent renders.
      // Passing a callback in useState lazy calls the
      // functions on the first render and never again.
      new BangleEditorState(props),
  );

  return state;
}

export function useSpecRegistry(
  initialSpecs,
  initialSpecRegistry,
  options = {},
) {
  const [specRegistry] = useState(() => {
    return initialSpecRegistry || new SpecRegistry(initialSpecs, options);
  });
  return specRegistry;
}

export function usePlugins(getPlugins = corePlugins) {
  if (typeof getPlugins !== 'function') {
    throw new Error('usePlugins error: getPlugins must be a function');
  }
  const [result] = useState(getPlugins);
  return result;
}

export function usePluginState(pluginKey) {
  const view = useEditorViewContext();
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

export function useEditorViewContext() {
  return useContext(EditorViewContext);
}
