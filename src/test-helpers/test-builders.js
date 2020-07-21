import { Fragment, Node, Slice } from 'prosemirror-model';

export const matches = (text, regexp) => {
  const results = [];
  let match;
  while ((match = regexp.exec(text))) {
    results.push(match);
  }
  return results;
};

/**
 * copied from https://bitbucket.org/atlassian/atlaskit-mk-2/src/6d37081dc8a6f49540bf25545326bc197193004c/packages/editor/editor-test-helpers/src/schema-builder.ts#packages/editor/editor-test-helpers/src/schema-builder.ts-27
 *
 * ProseMirror doesn't support empty text nodes, which can be quite
 * inconvenient when you want to capture a position ref without introducing
 * text.
 *
 * Take a couple of examples:
 *
 *     p('{<>}')
 *     p('Hello ', '{<>}', 'world!')
 *
 * After the ref syntax is stripped you're left with:
 *
 *     p('')
 *     p('Hello ', '', 'world!')
 *
 * This violates the rule of text nodes being non-empty. This class solves the
 * problem by providing an alternative data structure that *only* stores refs,
 * and can be used in scenarios where an empty text would be forbidden.
 *
 * This is done under the hood when using `text()` factory, and instead of
 * always returning a text node, it'll instead return one of two things:
 *
 * - a text node -- when given a non-empty string
 * - a refs tracker -- when given a string that *only* contains refs.
 */
export class RefsTracker {}

/**
 * Create a text node.
 *
 * Special markers called "refs" can be put in the text. Refs provide a way to
 * declaratively describe a position within some text, and then access the
 * position in the resulting node.
 */
export function text(value, schema) {
  let stripped = '';
  let textIndex = 0;
  const refs = {};
  // Helpers
  const isEven = (n) => n % 2 === 0;
  for (const match of matches(
    value,
    /([\\]+)?{(\w+|<|>|<>|<cell|cell>|<node>|<\|gap>|<gap\|>)}/g,
  )) {
    const [refToken, skipChars, refName] = match;
    let { index } = match;
    const skipLen = skipChars && skipChars.length;
    if (skipLen) {
      if (isEven(skipLen)) {
        index += skipLen / 2;
      } else {
        stripped += value.slice(textIndex, index + (skipLen - 1) / 2);
        stripped += value.slice(index + skipLen, index + refToken.length);
        textIndex = index + refToken.length;
        continue;
      }
    }
    stripped += value.slice(textIndex, index);
    refs[refName] = stripped.length;
    textIndex = match.index + refToken.length;
  }
  stripped += value.slice(textIndex);
  const node = stripped === '' ? new RefsTracker() : schema.text(stripped);
  node.refs = refs;
  return node;
}

/**
 * Offset ref position values by some amount.
 */
export function offsetRefs(refs, offset) {
  const result = {};
  for (const name in refs) {
    result[name] = refs[name] + offset;
  }
  return result;
}

/**
 * Given a collection of nodes, sequence them in an array and return the result
 * along with the updated refs.
 */
export function sequence(...content) {
  let position = 0;
  let refs = {};
  const nodes = [];
  // It's bizarre that this is necessary. An if/else in the for...of should have
  // sufficient but it did not work at the time of writing.
  const isRefsTracker = (n) => n instanceof RefsTracker;
  const isRefsNode = (n) => !isRefsTracker(n);
  for (const node of content) {
    if (isRefsTracker(node)) {
      refs = Object.assign(
        Object.assign({}, refs),
        offsetRefs(node.refs, position),
      );
    }
    if (isRefsNode(node)) {
      const thickness = node.isText ? 0 : 1;
      refs = Object.assign(
        Object.assign({}, refs),
        offsetRefs(node.refs, position + thickness),
      );
      position += node.nodeSize;
      nodes.push(node);
    }
  }
  return { nodes, refs };
}

/**
 * Given a jagged array, flatten it down to a single level.
 */
export function flatten(deep) {
  const flat = [];
  for (const item of deep) {
    if (Array.isArray(item)) {
      flat.splice(flat.length, 0, ...item);
    } else {
      flat.push(item);
    }
  }
  return flat;
}
/**
 * Coerce builder content into ref nodes.
 */
export function coerce(content, schema) {
  const refsContent = content.map((item) =>
    typeof item === 'string' ? text(item, schema) : item(schema),
  );
  return sequence(...flatten(refsContent));
}
/**
 * Create a factory for nodes.
 */
export function nodeFactory(type, attrs = {}, marks) {
  return function (...content) {
    return (schema) => {
      const { nodes, refs } = coerce(content, schema);
      const nodeBuilder = schema.nodes[type.name];
      if (!nodeBuilder) {
        throw new Error(
          `Node: "${
            type.name
          }" doesn't exist in schema. It's usually caused by lacking of a plugin that contributes this node. Schema contains following nodes: ${Object.keys(
            schema.nodes,
          ).join(', ')}`,
        );
      }
      const node = nodeBuilder.createChecked(attrs, nodes, marks);
      node.refs = refs;
      return node;
    };
  };
}
/**
 * Create a factory for marks.
 */
export function markFactory(type, attrs = {}, allowDupes = false) {
  return function (...content) {
    return (schema) => {
      const markBuilder = schema.marks[type.name];
      if (!markBuilder) {
        throw new Error(
          `Mark: "${
            type.name
          }" doesn't exist in schema. It's usually caused by lacking of a plugin that contributes this mark. Schema contains following marks: ${Object.keys(
            schema.marks,
          ).join(', ')}`,
        );
      }
      const mark = markBuilder.create(attrs);
      const { nodes } = coerce(content, schema);
      return nodes.map((node) => {
        if (!allowDupes && mark.type.isInSet(node.marks)) {
          return node;
        } else {
          const refNode = node.mark(mark.addToSet(node.marks));
          refNode.refs = node.refs;
          return refNode;
        }
      });
    };
  };
}
export const fragment = (...content) => flatten(content);
export const slice = (...content) =>
  new Slice(Fragment.from(coerce(content, sampleSchema).nodes), 0, 0);

/**
 * Builds a 'clean' version of the nodes, without Refs or RefTrackers
 */
export const clean = (content) => (schema) => {
  const node = content(schema);
  if (Array.isArray(node)) {
    return node.reduce((acc, next) => {
      if (next instanceof Node) {
        acc.push(Node.fromJSON(schema, next.toJSON()));
      }
      return acc;
    }, []);
  }
  return node instanceof Node
    ? Node.fromJSON(schema, node.toJSON())
    : undefined;
};

export const cleanOne = (content) => (schema) => {
  return clean(content)(schema)[0];
};

//
// Nodes
//
export const doc = nodeFactory({ name: 'doc' }, {});
export const p = nodeFactory({ name: 'paragraph' }, {});
export const blockquote = nodeFactory({ name: 'blockquote' }, {});
export const h1 = nodeFactory({ name: 'heading' }, { level: 1 });
export const h2 = nodeFactory({ name: 'heading' }, { level: 2 });
export const h3 = nodeFactory({ name: 'heading' }, { level: 3 });
export const h4 = nodeFactory({ name: 'heading' }, { level: 4 });
export const h5 = nodeFactory({ name: 'heading' }, { level: 5 });
export const h6 = nodeFactory({ name: 'heading' }, { level: 6 });
export const li = nodeFactory({ name: 'list_item' }, {});
export const ul = nodeFactory({ name: 'bullet_list' }, {});
export const ol = nodeFactory({ name: 'ordered_list' }, {});
export const br = nodeFactory({ name: 'hard_break' }, {});
export const codeBlock = (attrs = {}) =>
  nodeFactory({ name: 'code_block' }, attrs);
//
// Marks
//
export const italic = markFactory({ name: 'italic' }, {});
export const underline = markFactory({ name: 'underline' }, {});
export const bold = markFactory({ name: 'bold' }, {});
export const code = markFactory({ name: 'code' }, {});
