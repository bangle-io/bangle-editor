import { useRef, useState, useContext, useEffect } from 'react';
import { editorStateSetup2 } from '@banglejs/core/editor';
import { SpecRegistry } from '@banglejs/core/spec-registry';
import { Plugin, PluginKey } from '@banglejs/core/index';
import { EditorViewContext } from './ReactEditor';

const LOG = true;
let log = LOG ? console.log.bind(console, 'react/usePluginState') : () => {};

export function useEditorState({
  specs,
  specRegistry: _specRegistry,
  plugins: _plugins,
  ...options
}) {
  const optionsRef = useRef(options);
  const specRegistry = useSpecRegistry(specs, _specRegistry, {
    defaultSpecs: optionsRef.current.defaultSpecs,
  });
  const plugins = usePlugins(_plugins);
  const [pmState] = useState(() =>
    // Instantiate the editorState once and keep using that instance
    // on subsequent renders.
    // Passing a callback in useState lazy calls the
    // functions on the first render and never again.
    editorStateSetup2(specRegistry, plugins, optionsRef.current),
  );

  return { pmState, specRegistry };
}

export function useSpecRegistry(
  initialSpecs,
  initialSpecRegistry,
  options = {},
) {
  const [specRegistry] = useState(
    () => initialSpecRegistry || new SpecRegistry(initialSpecs, options),
  );
  return specRegistry;
}

export function usePlugins(getPlugins = () => {}) {
  if (typeof getPlugins !== 'function') {
    throw new Error('usePlugins error: getPlugins must be a function');
  }
  const [result] = useState(getPlugins);
  return result;
}

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
