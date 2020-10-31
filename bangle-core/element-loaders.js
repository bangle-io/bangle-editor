import { InputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { inputRules, undoInputRule } from 'prosemirror-inputrules';

export function schemaLoader(specs) {
  let nodes = [];
  let marks = [];
  let topNode = 'doc';
  for (const spec of specs) {
    if (spec.type === 'node') {
      nodes.push([spec.name, spec.schema]);
    }
    if (spec.type === 'mark') {
      marks.push([spec.name, spec.schema]);
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
}

export function loadInputRules(plugins) {
  let newPlugins = [];
  let match = [];
  plugins.forEach((plugin) => {
    if (plugin instanceof InputRule) {
      match.push(plugin);
      return;
    }
    newPlugins.push(plugin);
  });

  return [
    ...newPlugins,
    inputRules({
      rules: match,
    }),
  ];
}

export function loadPlugins(schema, plugins) {
  return plugins
    .flatMap((p) => {
      if (typeof p === 'function') {
        return p({ schema });
      }
      return p;
    })
    .filter(Boolean);
}
