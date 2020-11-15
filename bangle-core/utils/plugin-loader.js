import { InputRule } from 'prosemirror-inputrules';
import {
  inputRules as pmInputRules,
  undoInputRule as pmUndoInputRule,
} from 'prosemirror-inputrules';
import { keymap } from 'prosemirror-keymap';
import { gapCursor as pmGapCursor } from 'prosemirror-gapcursor';
import { baseKeymap as pmBaseKeymap } from 'prosemirror-commands';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import { bangleWarn, recursiveFlat } from './js-utils';
import { Plugin } from '../plugin';

// TODO do we need tabindex
// TODO reconfigure plugins
export function pluginLoader(
  specSheet,
  plugins,
  {
    editorProps,
    inputRules = true,
    baseKeymap = true,
    gapCursor = true,
    dropCursor = true,
    validate = true,
    transformPlugins = (p) => p,
  } = {},
) {
  const schema = specSheet.schema;

  plugins = recursiveFlat(plugins, { schema, specSheet });

  if (inputRules) {
    plugins = processInputRules(plugins);
  }

  if (baseKeymap) {
    plugins.push(keymap(pmBaseKeymap));
  }

  if (editorProps) {
    plugins.push(
      new Plugin({
        props: editorProps,
      }),
    );
  }

  if (dropCursor) {
    // Can overload prop dropCursor as options to prosemirror-dropcursor
    plugins.push(pmDropCursor(dropCursor === true ? undefined : dropCursor));
  }

  if (gapCursor) {
    plugins.push(pmGapCursor());
  }

  plugins = plugins.filter(Boolean);

  plugins = transformPlugins(plugins);

  if (validate) {
    if (plugins.some((p) => !(p instanceof Plugin))) {
      bangleWarn(
        'You are either using multiple versions of the library or not returning a Plugin class in your plugins. Investigate :',
        plugins.find((p) => !(p instanceof Plugin)),
      );
      throw new Error('Invalid plugin');
    }

    validateNodeViews(plugins, specSheet);
  }

  return plugins;
}

function processInputRules(
  plugins,
  { inputRules = true, undoInputRule = true } = {},
) {
  let newPlugins = [];
  let match = [];
  plugins.forEach((plugin) => {
    if (plugin instanceof InputRule) {
      match.push(plugin);
      return;
    }
    newPlugins.push(plugin);
  });

  if (inputRules) {
    plugins = [
      ...newPlugins,
      pmInputRules({
        rules: match,
      }),
    ];
  }

  if (undoInputRule) {
    plugins.push(
      keymap({
        Backspace: pmUndoInputRule,
      }),
    );
  }

  return plugins;
}

function validateNodeViews(plugins, specSheet) {
  const nodeViewPlugins = plugins.filter((p) => p.props && p.props.nodeViews);
  const nodeViewNames = new Map();
  for (const plugin of nodeViewPlugins) {
    for (const name of Object.keys(plugin.props.nodeViews)) {
      if (!specSheet.schema.nodes[name]) {
        bangleWarn(
          `When loading your plugins, we found nodeView implementation for the node '${name}' did not have a corresponding spec. Check the plugin:`,
          plugin,
          'and your specSheet',
          specSheet,
        );

        throw new Error(
          `NodeView validation failed. Spec for '${name}' not found.`,
        );
      }

      if (nodeViewNames.has(name)) {
        bangleWarn(
          `When loading your plugins, we found more than one nodeView implementation for the node '${name}'. Bangle can only have a single nodeView implementation, please check the following two plugins`,
          plugin,
          nodeViewNames.get(name),
        );
        throw new Error(
          `NodeView validation failed. Duplicate nodeViews for '${name}' found.`,
        );
      }
      nodeViewNames.set(name, plugin);
    }
  }
}
