import {
  matchAllPlus,
  objectMapValues,
} from '../utils/bangle-utils/utils/js-utils';

const PMNodes = {
  doc: 'doc',
  paragraph: 'paragraph',
  para: 'paragraph',
  ul: 'bullet_list',
  ol: 'ordered_list',
  li: 'list_item',
  blockquote: 'blockquote',
  codeBlock: 'code_block',
  br: 'hard_break',
  hr: 'horizontal_rule',
  todoList: 'todo_list',
  todoItem: 'todo_item',
  heading: 'heading',
};
const PMMarks = {
  link: 'link',
  underline: 'underline',
  italic: 'italic',
  bold: 'bold',
  code: 'code',
};

const posLabelMap = new WeakMap();
const posLabelMap2 = new WeakMap();

export function getPosLabels(t) {
  return posLabelMap.get(t);
}

export function getPosLabels2(t) {
  return posLabelMap2.get(t);
}

export function getDocLabels(doc) {
  if (!posLabelMap2.has(doc)) {
    doc.nodesBetween(0, doc.content.size, (node, pos) => {
      const found = posLabelMap2.get(node);
      if (!found) {
        return;
      }
      posLabelMap2.set(doc, {
        ...posLabelMap2.get(doc),
        ...objectMapValues(found, (v) => v + pos),
      });
    });
  }

  return posLabelMap2.get(doc);
}

class PlaceHolderNode {}

function matchEmptySelection(text) {
  const ranges = matchAllPlus(/(\[\])/g, text);
  const matches = ranges.filter((r) => r.match);

  if (matches.length > 1) {
    throw new Error('Multiple `[]` detected.');
  }

  if (matches.length === 0) {
    return {
      text,
    };
  }

  const [match] = matches;

  return {
    text: ranges
      .filter((r) => !r.match)
      .reduce((prev, cur) => prev + cur.subString, ''),
    pos: match.start,
  };
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

      const { text, pos } = matchEmptySelection(child);

      // We cannot have empty `Text`
      const pmText = text !== '' ? schema.text(text) : new PlaceHolderNode();

      if (pos != null) {
        posLabelMap.set(pmText, { '[]': pos });
        posLabelMap2.set(pmText, { '[]': pos });
      }

      return pmText;
    });
    const isPlaceHolder = (childNode) => childNode instanceof PlaceHolderNode;

    if (PMNodes[name]) {
      const node = schema.nodes[PMNodes[name]]?.createChecked(
        attrs || {},
        hydratedChildren.filter((r) => !isPlaceHolder(r)),
      );
      if (!node) {
        throw new Error('Cant find schema for node:' + name);
      }

      hydratedChildren.reduce((position, childNode) => {
        const childPosLabels = posLabelMap.get(childNode) || {};
        let thickness = 1;
        if (isPlaceHolder(childNode) || childNode.isText) {
          thickness = 0;
        }

        posLabelMap.set(node, {
          ...posLabelMap.get(node),
          ...objectMapValues(childPosLabels, (v) => v + position + thickness),
        });

        return isPlaceHolder(childNode)
          ? position
          : position + childNode.nodeSize;
      }, 0);

      return node;
    }

    if (PMMarks[name]) {
      const mark = schema.marks[PMMarks[name]].create(attrs || {});

      if (!mark) {
        throw new Error('Cant find schema for mark:' + name);
      }

      return hydratedChildren.map((node) => {
        if (mark.type.isInSet(node.marks)) {
          return node;
        }

        const newNode = node.mark(mark.addToSet(node.marks));
        return newNode;
      });
    }

    throw new Error('unknown type name:' + name);
  };
}
