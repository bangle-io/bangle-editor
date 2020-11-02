import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import {
  inputRules as pmInputRules,
  undoInputRule as pmUndoInputRule,
} from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';
import { keymap } from 'prosemirror-keymap';
import { gapCursor as pmGapCursor } from 'prosemirror-gapcursor';
import { baseKeymap as pmBaseKeymap } from 'prosemirror-commands';
import { CustomNodeView } from './helper-react/custom-node-view';
import { weakCache, recursiveFlat } from './utils/js-utils';

export function specValidate() {}

// TODO while this is fine, it hides the problem of - changing the editorSpec can create
// multiple schemas, which can cause hard to triage bugs.
export const schemaLoader = weakCache(function schemaLoader(editorSpec) {
  let nodes = [];
  let marks = [];
  let topNode = 'doc';
  editorSpec = recursiveFlat(editorSpec);
  for (const spec of editorSpec) {
    if (spec.type === 'node') {
      nodes.push([spec.name, spec.schema]);
    } else if (spec.type === 'mark') {
      marks.push([spec.name, spec.schema]);
    } else if (spec.type === 'component') {
    } else {
      throw new Error(spec.name + ' unknown type: ' + spec.type);
    }
    if (spec.topNode === true) {
      topNode = spec.name;
    }
  }

  return new Schema({
    topNode,
    nodes: Object.fromEntries(nodes),
    marks: Object.fromEntries(marks),
  });
});

export function loadInputRules(
  plugins,
  { inputRules = true, undoInputRule = true, injectPlugins = (p) => p } = {},
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

  plugins = injectPlugins(plugins);

  return plugins;
}

// TODO remove the added free plugins
// TODO do we need tabindex like in ../editor.js
// TODO reconfigure plugins
export function loadPlugins(
  editorSpec,
  plugins,
  {
    editorProps,
    inputRules = true,
    baseKeymap = true,
    gapCursor = true,
    dropCursor = false,
  } = {},
) {
  const schema = schemaLoader(editorSpec);

  plugins = recursiveFlat(plugins, { schema, editorSpec });

  if (editorProps) {
    plugins.push(
      new Plugin({
        props: editorProps,
      }),
    );
  }
  if (gapCursor) {
    plugins.push(pmGapCursor());
  }

  if (inputRules) {
    plugins = loadInputRules(plugins);
  }

  if (baseKeymap) {
    plugins.push(keymap(pmBaseKeymap));
  }

  return plugins.filter(Boolean);
}

export function loadNodeViews(editorSpec, renderNodeView, destroyNodeView) {
  return Object.fromEntries(
    editorSpec
      .filter((s) => s.type === 'node' && s.nodeView)
      .map((spec) => {
        return [
          spec.name,
          (node, view, getPos, decorations) => {
            return new CustomNodeView({
              node,
              view,
              getPos,
              decorations,
              spec,
              renderNodeView,
              destroyNodeView,
            });
          },
        ];
      }),
  );
}
