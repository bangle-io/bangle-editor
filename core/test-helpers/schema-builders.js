import { matchAllPlus, objectMapValues, weakCache } from '@bangle.dev/js-utils';

// Short hand to allow for smaller jsx syntax
// For example instead of `<paragraph>hello world</paragraph>`
// we can write `<para>hello world</para>`
const nodeAlias = {
  para: 'paragraph',
  ul: 'bulletList',
  ol: 'orderedList',
  li: 'listItem',
  codeBlock: 'codeBlock',
  br: 'hardBreak',
  hr: 'horizontalRule',
};
const markAlias = {};

const SELECT_END = ']';
const SELECT_START = '[';
const labelTypes = {
  // Empty Selection
  '[]': /\[\]/,
  // Selection anchor
  [SELECT_START]: /\[(?!\])/,
  // Selection head
  [SELECT_END]: /(?<!\[)\]/,
};

const nodeLabelPosMap = new WeakMap();
const isNotValidLabel = (label) => !Boolean(labelTypes[label]);

const updateMap = (map, key, value) =>
  map.set(key, safeMergeObject(map.get(key), value));

export const getDocLabels = weakCache((doc) => {
  let result = {};
  doc.nodesBetween(0, doc.content.size, (node, pos) => {
    const found = nodeLabelPosMap.get(node);
    if (!found) {
      return;
    }
    const resolvedLabels = objectMapValues(found, (v) => {
      return typeof v === 'function' ? v(pos, node.content.content) : pos + v;
    });
    result = safeMergeObject(result, resolvedLabels);
  });
  return result;
});

/**
 * A function used by babel to convert jsx (calling it psx, 'p' for prosemirror) syntax into
 * something which we can use to build a prosemirror document.
 * Read more about custom JSX pragma at https://www.gatsbyjs.com/blog/2019-08-02-what-is-jsx-pragma/
 *
 * For example:
 *  '<doc><heading level={1}>hello</heading></doc>' will be converted by babel to
 *  'psx("doc", null, psx("heading", {level: "1"}))' which will then accept a
 *   prosemirror `schema` to produce a Prosemirror Document.
 *
 * Here is the summary:
 *
 * ~Babel~
 * <psx /> => psx(...)
 *
 * ~Tests~
 * psx(...)(schema) => ProseMirror Document
 *
 */
export function psx(name, attrs, ...childrenRaw) {
  return (schema) => {
    const children = []
      .concat(...childrenRaw)
      .map((c) => (typeof c === 'string' ? c : c(schema)));

    const hydratedChildren = children.flatMap((child) => {
      if (typeof child !== 'string') {
        return child;
      }
      const { text, labels } = matchLabel(child);

      if (!labels) {
        return schema.text(child);
      }

      // We cannot have empty string as a valid TextNode in Prosemirror.
      // For example in:
      //  <doc>
      //     <para>foo</para>
      //     <para>[]</para>
      //     <para>bar</para>
      //  </doc>
      // Unlike first and third paragraph, in the second paragraph, we do not create a TextNode
      // but instead return the string `[]` directly, so that when parent node
      // creates the Paragraph node, it sets up the position correctly. In this case
      // it will create a selection at start of paragraph node.
      // Note: paragraph nodes can be empty, but not textNodes.
      if (text === '') {
        if (Object.keys(labels).length > 1) {
          throw new Error('Cannot have multiple labels in an empty node');
        }
        return Object.keys(labels)[0];
      }

      const pmText = schema.text(text);
      updateMap(nodeLabelPosMap, pmText, labels);

      return pmText;
    });

    const nodeSpec = schema.nodes[name] || schema.nodes[nodeAlias[name]];

    if (nodeSpec) {
      const node = nodeSpec.createChecked(
        attrs || {},
        hydratedChildren.filter((r) => isNotValidLabel(r)),
      );

      hydratedChildren.forEach((label, index) => {
        if (isNotValidLabel(label)) {
          return;
        }

        updateMap(nodeLabelPosMap, node, {
          [label]: (pos) => {
            const validChildren = hydratedChildren
              .slice(0, index)
              .filter((r) => isNotValidLabel(r));

            const relPos = validChildren.reduce(
              (prev, cur) => prev + cur.nodeSize,
              0,
            );

            // Add a 1 to put it inside the the node.
            // for example in A<p>B</p>, pos + relPos will get us A
            // adding 1 will put us inside.
            return pos + relPos + 1;
          },
        });
      });

      return node;
    }

    const markSpec = schema.marks[name] || schema.marks[markAlias[name]];

    if (markSpec) {
      const mark = markSpec.create(attrs || {});
      return hydratedChildren.map((node) => {
        if (mark.type.isInSet(node.marks)) {
          return node;
        }
        const newNode = node.mark(mark.addToSet(node.marks));
        const labels = nodeLabelPosMap.get(node);
        // forward any labels as we are creating a new node
        updateMap(nodeLabelPosMap, newNode, labels);
        return newNode;
      });
    }

    throw new Error('Cannot find schema for ' + name);
  };
}

function matchLabel(text) {
  const matcher = (regex) => {
    const ranges = matchAllPlus(regex, text);
    const matches = ranges.filter((r) => r.match);

    if (matches.length === 0) {
      return {
        text,
        labels: undefined,
      };
    }

    return {
      text: ranges
        .filter((r) => !r.match)
        .reduce((prev, cur) => prev + cur.subString, ''),
      labels: matches.reduce((prev, r) => {
        let pos = r.start;
        // Reduce selection end position by 1
        // since all of the positions after SELECT_START are off by 1
        // as `[` takes 1 space.
        if (
          r.subString === SELECT_END &&
          matches.some((m) => m.subString === SELECT_START)
        ) {
          pos = pos - 1;
        }
        return safeMergeObject(prev, { [r.subString]: pos });
      }, {}),
    };
  };

  return matcher(
    new RegExp(
      Object.values(labelTypes)
        .map((r) => '(' + r.source + ')')
        .join('|'),
      'g',
    ),
  );
}

function safeMergeObject(obj1 = {}, obj2 = {}) {
  const culpritKey = Object.keys(obj1).find((key) => hasOwnProperty(obj2, key));
  if (culpritKey) {
    throw new Error(`Key ${culpritKey} already exists `);
  }

  return {
    ...obj1,
    ...obj2,
  };
}

function hasOwnProperty(obj, property) {
  return Object.prototype.hasOwnProperty.call(obj, property);
}
