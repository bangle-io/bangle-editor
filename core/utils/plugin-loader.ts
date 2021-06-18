import {
  InputRule,
  inputRules as pmInputRules,
  undoInputRule as pmUndoInputRule,
} from 'prosemirror-inputrules';

import { keymap } from 'prosemirror-keymap';
import { gapCursor as pmGapCursor } from 'prosemirror-gapcursor';
import { baseKeymap as pmBaseKeymap } from 'prosemirror-commands';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import type { EditorProps } from 'prosemirror-view';
import { bangleWarn } from './js-utils';
import { Schema } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import { PluginGroup } from '../plugin';
import * as history from '../components/history';
import * as editorStateCounter from '../components/editor-state-counter';

interface PluginPayload {
  schema: Schema;
  specRegistry: any;
  metadata: any;
}

export type RawPlugins =
  | Plugin
  | ((payLoad: PluginPayload) => Plugin)
  | PluginGroup
  | (() => PluginGroup)
  | (() => RawPlugins)
  | RawPlugins[];

export function pluginLoader(
  specRegistry: any,
  plugins: RawPlugins,
  {
    metadata = {},
    editorProps,
    defaultPlugins = true,
    dropCursorOpts,
    transformPlugins = (p) => p,
  }: {
    metadata?: any;
    editorProps?: EditorProps;
    defaultPlugins?: boolean;
    dropCursorOpts?: any;
    transformPlugins?: (plugins: Plugin[]) => Plugin[];
  } = {},
) {
  const schema = specRegistry.schema;
  const pluginPayload = {
    schema,
    specRegistry,
    metadata,
  };

  let [flatPlugins, pluginGroupNames] = flatten(plugins, pluginPayload);

  if (defaultPlugins) {
    let defaultPluginGroups = [];

    if (!pluginGroupNames.has('history')) {
      defaultPluginGroups.push(history.plugins());
    }

    if (!pluginGroupNames.has('editorStateCounter')) {
      defaultPluginGroups.push(editorStateCounter.plugins());
    }

    flatPlugins = flatPlugins.concat(
      flatten(defaultPluginGroups, pluginPayload)[0],
    );

    flatPlugins = processInputRules(flatPlugins);

    flatPlugins.push(
      keymap(pmBaseKeymap),
      pmDropCursor(dropCursorOpts),
      pmGapCursor(),
    );
  }

  if (editorProps) {
    flatPlugins.push(
      new Plugin({
        props: editorProps,
      }),
    );
  }

  flatPlugins = flatPlugins.filter(Boolean);
  flatPlugins = transformPlugins(flatPlugins);

  if (flatPlugins.some((p: any) => !(p instanceof Plugin))) {
    // console.log('flatPlugins=', flatPlugins)
    // const x= flatPlugins.find((p) => !(p instanceof Plugin));
    // console.log('p=', x)
    bangleWarn(
      'You are either using multiple versions of the library or not returning a Plugin class in your plugins. Investigate :',
      flatPlugins.find((p: any) => !(p instanceof Plugin)),
    );
    throw new Error('Invalid plugin');
  }

  validateNodeViews(flatPlugins, specRegistry);

  return flatPlugins;
}

function processInputRules(
  plugins: any[],
  { inputRules = true, undoInputRule = true } = {},
) {
  let newPlugins: any[] = [];
  let match: InputRule[] = [];
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

function validateNodeViews(plugins: Plugin[], specRegistry: any) {
  const nodeViewPlugins = plugins.filter(
    (p: any) => p.props && p.props.nodeViews,
  );
  const nodeViewNames = new Map();
  for (const plugin of nodeViewPlugins) {
    for (const name of Object.keys(plugin.props.nodeViews as any)) {
      if (!specRegistry.schema.nodes[name]) {
        bangleWarn(
          `When loading your plugins, we found nodeView implementation for the node '${name}' did not have a corresponding spec. Check the plugin:`,
          plugin,
          'and your specRegistry',
          specRegistry,
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

function flatten(rawPlugins: RawPlugins, callbackPayload: PluginPayload) {
  const pluginGroupNames = new Set();

  const recurse = (plugins: RawPlugins): any => {
    if (Array.isArray(plugins)) {
      return plugins.flatMap((p) => recurse(p)).filter(Boolean);
    }

    if (plugins instanceof PluginGroup) {
      if (pluginGroupNames.has(plugins.name)) {
        throw new Error(
          `Duplicate names of pluginGroups ${plugins.name} not allowed.`,
        );
      }
      pluginGroupNames.add(plugins.name);
      return recurse(plugins.plugins);
    }

    if (typeof plugins === 'function') {
      if (!callbackPayload) {
        throw new Error('Found a function but no payload');
      }
      return recurse(plugins(callbackPayload));
    }

    return plugins;
  };

  return [recurse(rawPlugins), pluginGroupNames];
}
