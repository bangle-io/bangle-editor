import {
  matchAllPlus,
  objectMapValues,
  safeMergeObject,
} from '../utils/bangle-utils/utils/js-utils';

const PMNodesAlias = {
  para: 'paragraph',
  ul: 'bullet_list',
  ol: 'ordered_list',
  li: 'list_item',
  codeBlock: 'code_block',
  br: 'hard_break',
  hr: 'horizontal_rule',
  todoList: 'todo_list',
  todoItem: 'todo_item',
};
const PMMarksAlias = {};

const labelTypes = {
  // Empty Selection
  '[]': /(\[\])/g,
  // Selection anchor
  '[': /\[(?!\])/g,
  // Selection head
  ']': /(?<!\[)\]/g,
};

const isNotValidLabel = (label) => !Boolean(labelTypes[label]);
const nodeLabelMap = new WeakMap();
const docLabelMap = new WeakMap();

const updateMap = (map, key, value) => {
  const existing = map.get(key) || {};
  map.set(key, safeMergeObject(existing, value));
};

export function getDocLabels(doc) {
  if (!docLabelMap.has(doc)) {
    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      const found = nodeLabelMap.get(node);
      if (!found) {
        return;
      }
      const resolvedLabels = objectMapValues(found, (v) => {
        return typeof v === 'function' ? v(pos, node.content.content) : pos + v;
      });
      updateMap(docLabelMap, doc, resolvedLabels);
    });
  }

  return docLabelMap.get(doc);
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
      labels: matches.reduce(
        (prev, r) => safeMergeObject(prev, { [r.subString]: r.start }),
        {},
      ),
    };
  };

  let result = matcher(/(\[\])|\[(?!\])|(?<!\[)\]/g);
  return result;
}

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
      updateMap(nodeLabelMap, pmText, labels);

      return pmText;
    });

    const nodeName = PMNodesAlias[name] || name;

    if (nodeName) {
      const node = schema.nodes[nodeName]?.createChecked(
        attrs || {},
        hydratedChildren.filter((r) => isNotValidLabel(r)),
      );
      if (!node) {
        throw new Error('Cant find schema for node:' + name);
      }

      hydratedChildren.forEach((label, index) => {
        if (isNotValidLabel(label)) {
          return;
        }

        updateMap(nodeLabelMap, node, {
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

    const markName = PMMarksAlias[name] || name;

    if (markName) {
      const mark = schema.marks[markName].create(attrs || {});

      if (!mark) {
        throw new Error('Cant find schema for mark:' + name);
      }

      return hydratedChildren.map((node) => {
        if (mark.type.isInSet(node.marks)) {
          return node;
        }
        const newNode = node.mark(mark.addToSet(node.marks));
        const labels = nodeLabelMap.get(node);
        // forward any labels as we are creating a new node
        updateMap(nodeLabelMap, newNode, labels);
        return newNode;
      });
    }

    throw new Error('unknown type name:' + name);
  };
}
