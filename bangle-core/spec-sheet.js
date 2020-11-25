import { Schema } from 'prosemirror-model';
import { coreSpec } from './components/index';
import { bangleWarn, recursiveFlat } from './utils/js-utils';

export class SpecSheet {
  constructor(rawSpecs = coreSpec()) {
    this._spec = recursiveFlat(rawSpecs);

    this._spec.forEach(validateSpec);

    if (this._spec.length !== new Set(this._spec.map((r) => r.name)).size) {
      bangleWarn(
        'The specSheet has one or more specs with the same name',
        this._spec,
      );
      throw new Error('Duplicate spec error, please check your specSheet');
    }
    this._schema = createSchema(this._spec);
    this._options = Object.fromEntries(
      this._spec
        .filter((spec) => spec.options)
        .map((spec) => [spec.name, spec.options]),
    );
  }

  get spec() {
    return this._spec;
  }

  get schema() {
    return this._schema;
  }

  get options() {
    return this._options;
  }
}

function createSchema(specSheet) {
  let nodes = [];
  let marks = [];
  let topNode;
  for (const spec of specSheet) {
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
}

function validateSpec(spec) {
  if (!spec.name) {
    bangleWarn("The spec didn't have a name field", spec);
    throw new Error('Spec must have a name');
  }
  if (!['node', 'mark', 'component'].includes(spec.type)) {
    bangleWarn('The spec must be of type node, mark or component ', spec);
    throw new Error('Invalid spec type');
  }
  if (['node', 'mark'].includes(spec.type) && !spec.schema) {
    bangleWarn(
      "The spec of type 'mark' or 'node' must have a schema field",
      spec,
    );
    throw new Error('Invalid spec schema');
  }
}
