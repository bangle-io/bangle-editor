import { InputRule } from 'prosemirror-inputrules';
import {
  inputRules as pmInputRules,
  undoInputRule as pmUndoInputRule,
} from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { gapCursor as pmGapCursor } from 'prosemirror-gapcursor';
import { baseKeymap as pmBaseKeymap } from 'prosemirror-commands';
import { dropCursor as pmDropCursor } from 'prosemirror-dropcursor';
import { recursiveFlat } from './js-utils';
import { SpecSheet } from 'bangle-core/spec-sheet';

// TODO remove the added free plugins
// TODO do we need tabindex
// TODO reconfigure plugins
export function pluginsLoader(
  specSheet,
  plugins,
  {
    editorProps,
    inputRules = true,
    baseKeymap = true,
    gapCursor = true,
    dropCursor = true,
    transformPlugins = (p) => p,
  } = {},
) {
  if (!(specSheet instanceof SpecSheet)) {
    throw new Error('Fix sheet');
  }
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

  plugins = transformPlugins(plugins);

  return plugins.filter(Boolean);
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
