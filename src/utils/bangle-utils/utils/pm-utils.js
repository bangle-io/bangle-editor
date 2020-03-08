import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';
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
  return function(state, dispatch, view) {
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

export const isFirstChildOfParent = (state) => {
  const { $from } = state.selection;
  return $from.depth > 1
    ? // (state.selection instanceof GapCursorSelection &&
      //     $from.parentOffset === 0)
      //     ||
      $from.index($from.depth - 1) === 0
    : true;
};
