import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';
import { GapCursorSelection } from '../gap-cursor';
import { Fragment, Slice } from 'prosemirror-model';

/**
 * whether the mark of type is active
 * @returns {Boolean}
 */
export function isMarkActive(editorState, type) {
  const { from, $from, to, empty } = editorState.selection;
  if (empty) {
    return Boolean(type.isInSet(editorState.storedMarks || $from.marks()));
  }
  return Boolean(editorState.doc.rangeHasMark(from, to, type));
}

export const validPos = (pos, doc) =>
  Number.isInteger(pos) && pos >= 0 && pos < doc.content.size;

export const validListParent = (type, schemaNodes) => {
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
    todo_list: todoList,
  } = schemaNodes;
  return [bulletList, orderedList, todoList].includes(type);
};
// export function isMarkActive(mark, doc, from, to) {
//   let active = false;
// // TIP on how to iterate between all nodes
//   doc.nodesBetween(from, to, (node) => {
//     if (!active && mark.isInSet(node.marks)) {
//       active = true;
//     }
//   });

//   return active;
// }

// TODO document this, probably gets the attributes of the mark of the current selection
export default function getMarkAttrs(editorState, type) {
  const { from, to } = editorState.selection;
  let marks = [];

  editorState.doc.nodesBetween(from, to, (node) => {
    marks = [...marks, ...node.marks];
  });

  const mark = marks.find((markItem) => markItem.type.name === type.name);

  return mark ? mark.attrs : {};
}

export function nodeIsActive(editorState, type, attrs = {}) {
  const predicate = (node) => node.type === type;
  const node =
    findSelectedNodeOfType(type)(editorState.selection) ||
    findParentNode(predicate)(editorState.selection);

  if (!Object.keys(attrs).length || !node) {
    return !!node;
  }

  return node.node.hasMarkup(type, attrs);
}

export function findChangedNodesFromTransaction(tr) {
  const nodes = [];
  const steps = tr.steps || [];
  steps.forEach((step) => {
    const { to, from, slice } = step;
    const size = slice && slice.content ? slice.content.size : 0;
    for (let i = from; i <= to + size; i++) {
      if (i <= tr.doc.content.size) {
        const topLevelNode = tr.doc.resolve(i).node(1);
        if (topLevelNode && !nodes.find((n) => n === topLevelNode)) {
          nodes.push(topLevelNode);
        }
      }
    }
  });
  return nodes;
}

/**
 * from atlaskit
 * Returns false if node contains only empty inline nodes and hardBreaks.
 */
export function hasVisibleContent(node) {
  const isInlineNodeHasVisibleContent = (inlineNode) => {
    return inlineNode.isText
      ? !!inlineNode.textContent.trim()
      : inlineNode.type.name !== 'hard_break';
  };
  if (node.isInline) {
    return isInlineNodeHasVisibleContent(node);
  } else if (node.isBlock && (node.isLeaf || node.isAtom)) {
    return true;
  } else if (!node.childCount) {
    return false;
  }
  for (let index = 0; index < node.childCount; index++) {
    const child = node.child(index);
    if (hasVisibleContent(child)) {
      return true;
    }
  }
  return false;
}

/**
 *  * from atlaskit
 * Checks if a node has any content. Ignores node that only contain empty block nodes.
 */
export function isNodeEmpty(node) {
  if (node && node.textContent) {
    return false;
  }
  if (
    !node ||
    !node.childCount ||
    (node.childCount === 1 && isEmptyParagraph(node.firstChild))
  ) {
    return true;
  }
  const block = [];
  const nonBlock = [];
  node.forEach((child) => {
    child.isInline ? nonBlock.push(child) : block.push(child);
  });
  return (
    !nonBlock.length &&
    !block.filter(
      (childNode) =>
        (!!childNode.childCount &&
          !(
            childNode.childCount === 1 && isEmptyParagraph(childNode.firstChild)
          )) ||
        childNode.isAtom,
    ).length
  );
}
/**
 * Checks if a node looks like an empty document
 */
export function isEmptyDocument(node) {
  const nodeChild = node.content.firstChild;
  if (node.childCount !== 1 || !nodeChild) {
    return false;
  }
  return (
    nodeChild.type.name === 'paragraph' &&
    !nodeChild.childCount &&
    nodeChild.nodeSize === 2 &&
    (!nodeChild.marks || nodeChild.marks.length === 0)
  );
}
/*
 * from atlaskit
 * Checks if node is an empty paragraph.
 */
export function isEmptyParagraph(node) {
  return (
    !node ||
    (node.type.name === 'paragraph' && !node.textContent && !node.childCount)
  );
}

/**
 * from atlaskit
 */
export function filter(predicates, cmd) {
  return function (state, dispatch, view) {
    if (!Array.isArray(predicates)) {
      predicates = [predicates];
    }
    if (predicates.some((pred) => !pred(state, view))) {
      return false;
    }
    return cmd(state, dispatch, view) || false;
  };
}

// from atlaskit
// https://github.com/ProseMirror/prosemirror-commands/blob/master/src/commands.js#L90
// Keep going left up the tree, without going across isolating boundaries, until we
// can go along the tree at that same level
//
// You can think of this as, if you could construct each document like we do in the tests,
// return the position of the first ) backwards from the current selection.
export function findCutBefore($pos) {
  // parent is non-isolating, so we can look across this boundary
  if (!$pos.parent.type.spec.isolating) {
    // search up the tree from the pos's *parent*
    for (let i = $pos.depth - 1; i >= 0; i--) {
      // starting from the inner most node's parent, find out
      // if we're not its first child
      if ($pos.index(i) > 0) {
        return $pos.doc.resolve($pos.before(i + 1));
      }
      if ($pos.node(i).type.spec.isolating) {
        break;
      }
    }
  }
  return null;
}

export function isRangeOfType(doc, $from, $to, nodeType) {
  return (
    getAncestorNodesBetween(doc, $from, $to).filter(
      (node) => node.type !== nodeType,
    ).length === 0
  );
}

/**
 * Returns all top-level ancestor-nodes between $from and $to
 */
export function getAncestorNodesBetween(doc, $from, $to) {
  const nodes = [];
  const maxDepth = findAncestorPosition(doc, $from).depth;
  let current = doc.resolve($from.start(maxDepth));

  while (current.pos <= $to.start($to.depth)) {
    const depth = Math.min(current.depth, maxDepth);
    const node = current.node(depth);

    if (node) {
      nodes.push(node);
    }

    if (depth === 0) {
      break;
    }

    let next = doc.resolve(current.after(depth));
    if (next.start(depth) >= doc.nodeSize - 2) {
      break;
    }

    if (next.depth !== current.depth) {
      next = doc.resolve(next.pos + 2);
    }

    if (next.depth) {
      current = doc.resolve(next.start(next.depth));
    } else {
      current = doc.resolve(next.end(next.depth));
    }
  }

  return nodes;
}

/**
 * Traverse the document until an "ancestor" is found. Any nestable block can be an ancestor.
 */
export function findAncestorPosition(doc, pos) {
  const nestableBlocks = ['blockquote', 'bullet_list', 'ordered_list'];

  if (pos.depth === 1) {
    return pos;
  }

  let node = pos.node(pos.depth);
  let newPos = pos;
  while (pos.depth >= 1) {
    pos = doc.resolve(pos.before(pos.depth));
    node = pos.node(pos.depth);

    if (node && nestableBlocks.indexOf(node.type.name) !== -1) {
      newPos = pos;
    }
  }

  return newPos;
}

export const isEmptySelectionAtStart = (state) => {
  const { empty, $from } = state.selection;
  return (
    empty &&
    ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection)
  );
};

/**
 * Removes marks from nodes in the current selection that are not supported
 */
export const sanitiseSelectionMarksForWrapping = (state, newParentType) => {
  let tr;
  const { from, to } = state.tr.selection;

  state.doc.nodesBetween(
    from,
    to,
    (node, pos, parent) => {
      // If iterate over a node thats out of our defined range
      // We skip here but continue to iterate over its children.
      if (node.isText || pos < from || pos > to) {
        return true;
      }
      node.marks.forEach((mark) => {
        if (
          !parent.type.allowsMarkType(mark.type) ||
          (newParentType && !newParentType.allowsMarkType(mark.type))
        ) {
          const filteredMarks = node.marks.filter((m) => m.type !== mark.type);
          const position = pos > 0 ? pos - 1 : 0;
          tr = (tr || state.tr).setNodeMarkup(
            position,
            undefined,
            node.attrs,
            filteredMarks,
          );
        }
      });
    },
    from,
  );
  return tr;
};

// This will return (depth - 1) for root list parent of a list.
export const getListLiftTarget = (type, schema, resPos) => {
  let target = resPos.depth;
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
    todo_list: todoList,
  } = schema.nodes;
  let listItem = type;
  if (!listItem) {
    ({ list_item: listItem } = schema.nodes);
  }

  for (let i = resPos.depth; i > 0; i--) {
    const node = resPos.node(i);
    if (
      node.type === bulletList ||
      node.type === orderedList ||
      node.type === todoList
    ) {
      target = i;
    }
    if (
      node.type !== bulletList &&
      node.type !== orderedList &&
      node.type !== todoList &&
      node.type !== listItem
    ) {
      break;
    }
  }
  return target - 1;
};

export function mapChildren(node, callback) {
  const array = [];
  for (let i = 0; i < node.childCount; i++) {
    array.push(
      callback(
        node.child(i),
        i,
        node instanceof Fragment ? node : node.content,
      ),
    );
  }

  return array;
}

/**
 *
 * -----------
 * State Helpers
 * ------------
 *
 */

export const isFirstChildOfParent = (state) => {
  const { $from } = state.selection;
  return $from.depth > 1
    ? (state.selection instanceof GapCursorSelection &&
        $from.parentOffset === 0) ||
        $from.index($from.depth - 1) === 0
    : true;
};

export function mapSlice(
  slice,
  callback /*: (node, parent, index) => Node | Node[] | Fragment | null,*/,
) {
  const fragment = mapFragment(slice.content, callback);
  return new Slice(fragment, slice.openStart, slice.openEnd);
}

export function mapFragment(
  content,
  callback,
  parent,

  /*: (
    node: Node,
    parent: Node | null,
    index: number,
  ) => Node | Node[] | Fragment | null,*/
) {
  const children = [];
  for (let i = 0, size = content.childCount; i < size; i++) {
    const node = content.child(i);
    const transformed = node.isLeaf
      ? callback(node, parent, i)
      : callback(
          node.copy(mapFragment(node.content, callback, node)),
          parent,
          i,
        );
    if (transformed) {
      if (transformed instanceof Fragment) {
        children.push(...getFragmentBackingArray(transformed));
      } else if (Array.isArray(transformed)) {
        children.push(...transformed);
      } else {
        children.push(transformed);
      }
    }
  }
  return Fragment.fromArray(children);
}

export function getFragmentBackingArray(fragment) {
  return fragment.content;
}
