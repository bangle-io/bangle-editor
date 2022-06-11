import type { EditorProps } from '@bangle.dev/pm';
import {
  baseKeymap as pmBaseKeymap,
  dropCursor as pmDropCursor,
  gapCursor as pmGapCursor,
  inputRules as pmInputRules,
  keymap,
  Plugin,
  Schema,
  InputRule,
  undoInputRule as pmUndoInputRule,
} from '@bangle.dev/pm';
import { bangleWarn } from '@bangle.dev/utils';
import * as editorStateCounter from './editor-state-counter';
import * as history from './history';
import { PluginGroup } from './plugin-group';
import type { SpecRegistry } from './spec-registry';

export interface PluginPayload<T = any> {
  schema: Schema;
  specRegistry: SpecRegistry;
  metadata: T;
}

type BaseRawPlugins =
  | false
  | null
  | Plugin
  | InputRule
  | PluginGroup
  | BaseRawPlugins[];

export type RawPlugins<T = any> =
  | BaseRawPlugins
  | ((payLoad: PluginPayload<T>) => BaseRawPlugins);

export function pluginLoader<T = any>(
  specRegistry: SpecRegistry,
  plugins: RawPlugins<T>,
  {
    metadata,
    editorProps,
    defaultPlugins = true,
    dropCursorOpts,
    transformPlugins = (p) => p,
  }: {
    metadata?: T;
    editorProps?: EditorProps;
    defaultPlugins?: boolean;
    dropCursorOpts?: Parameters<typeof pmDropCursor>[0];
    transformPlugins?: (plugins: Plugin[]) => Plugin[];
  } = {},
): Plugin[] {
  const schema = specRegistry.schema;
  const pluginPayload = {
    schema,
    specRegistry,
    metadata: metadata,
  };

  let [flatPlugins, pluginGroupNames] = flatten(plugins, pluginPayload);

  if (defaultPlugins) {
    let defaultPluginGroups: RawPlugins[] = [];

    if (!pluginGroupNames.has('history')) {
      defaultPluginGroups.push(history.plugins());
    }

    if (!pluginGroupNames.has('editorStateCounter')) {
      defaultPluginGroups.push(editorStateCounter.plugins());
    }

    flatPlugins = flatPlugins.concat(
      // TODO: deprecate the ability pass a callback to the plugins param of pluginGroup
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
  plugins: Plugin[],
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

function flatten<T>(
  rawPlugins: RawPlugins,
  callbackPayload: PluginPayload<T>,
): [Plugin[], Set<string>] {
  const pluginGroupNames = new Set<string>();

  const recurse = (plugins: RawPlugins): any => {
    if (Array.isArray(plugins)) {
      return plugins.flatMap((p: any) => recurse(p)).filter(Boolean);
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
