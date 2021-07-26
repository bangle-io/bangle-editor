import { Mark, MarkSpec, NodeSpec, Schema, Node } from '@bangle.dev/pm';
import { bangleWarn } from '@bangle.dev/utils';
import * as doc from './critical-components/doc';
import * as paragraph from './critical-components/paragraph';
import * as text from './critical-components/text';

import type { MarkdownSerializerState } from 'prosemirror-markdown';

const LOG = false;
let log = LOG ? console.log.bind(console, 'SpecRegistry') : () => {};

type PMSpec = NodeSpec | MarkSpec;

export type RawSpecs =
  | {
      name: string;
      type: 'node';
      topNode?: boolean;
      schema: NodeSpec;
      markdown?: {
        toMarkdown: (
          state: MarkdownSerializerState,
          node: Node,
          parent: Node,
          index: number,
        ) => void;
        parseMarkdown?: {
          [key: string]: any;
        };
      };
      options?: { [k: string]: any };
    }
  | {
      name: string;
      type: 'mark';
      schema: MarkSpec;
      markdown?: {
        toMarkdown: {
          open:
            | string
            | ((
                _state: MarkdownSerializerState,
                mark: Mark,
                parent: Node,
                index: number,
              ) => void);
          close:
            | string
            | ((
                _state: MarkdownSerializerState,
                mark: Mark,
                parent: Node,
                index: number,
              ) => void);
          mixable?: boolean;
          escape?: boolean;
          expelEnclosingWhitespace?: boolean;
        };
        parseMarkdown?: {
          [k: string]: any;
        };
      };
      options?: { [k: string]: any };
    }
  | null
  | false
  | undefined
  | RawSpecs[];

export class SpecRegistry<N extends string = any, M extends string = any> {
  _spec: PMSpec[];
  _schema: Schema<N, M>;
  _options: { [key: string]: any };

  constructor(rawSpecs: RawSpecs = [], { defaultSpecs = true } = {}) {
    let flattenedSpecs = flatten(rawSpecs);

    flattenedSpecs.forEach(validateSpec);

    const names = new Set(flattenedSpecs.map((r: PMSpec) => r.name));

    if (flattenedSpecs.length !== names.size) {
      bangleWarn(
        'The specRegistry has one or more specs with the same name',
        flattenedSpecs,
      );
      throw new Error('Duplicate spec error, please check your specRegistry');
    }

    if (defaultSpecs) {
      const defaultSpecsArray: RawSpecs[] = [];
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

function createSchema(specRegistry: SpecRegistry['_spec']) {
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

function validateSpec(spec: any) {
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

function flatten(data: RawSpecs): PMSpec[] {
  const recurse = (d: RawSpecs): PMSpec[] => {
    if (Array.isArray(d)) {
      return d.flatMap((i) => recurse(i)).filter(Boolean);
    }
    // @ts-ignore really hard to annotate recursive functions
    return d;
  };

  return recurse(data);
}
