import { Schema } from 'prosemirror-model';
import { doc, paragraph, text } from './components/index';
import { bangleWarn } from './utils/js-utils';

const LOG = false;
let log = LOG ? console.log.bind(console, 'SpecRegistry') : () => {};

export class SpecRegistry {
  constructor(rawSpecs = [], { defaultSpecs = true } = {}) {
    let flattenedSpecs = flatten(rawSpecs);

    flattenedSpecs.forEach(validateSpec);

    const names = new Set(flattenedSpecs.map((r) => r.name));

    if (flattenedSpecs.length !== names.size) {
      bangleWarn(
        'The specRegistry has one or more specs with the same name',
        flattenedSpecs,
      );
      throw new Error('Duplicate spec error, please check your specRegistry');
    }

    if (defaultSpecs) {
      const defaultSpecsArray = [];
      if (!names.has('paragraph')) {
        defaultSpecsArray.unshift(paragraph.spec());
      }
      if (!names.has('text')) {
        defaultSpecsArray.unshift(text.spec());
      }
      if (!names.has('doc')) {
        defaultSpecsArray.unshift(doc.spec());
      }
      flattenedSpecs = [...flatten(defaultSpecsArray), ...flattenedSpecs];
    }

    this._spec = flattenedSpecs;
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

function createSchema(specRegistry) {
  let nodes = [];
  let marks = [];
  let topNode;
  for (const spec of specRegistry) {
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
    throw new Error('Invalid spec. Spec must have a name');
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

function flatten(data) {
  const recurse = (d) => {
    if (Array.isArray(d)) {
      return d.flatMap((i) => recurse(i)).filter(Boolean);
    }
    return d;
  };

  return recurse(data);
}
