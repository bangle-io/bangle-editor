import {
  findParentNode,
  safeInsert as _safeInsert,
  removeSelectedNode as _removeSelectedNode,
  findSelectedNodeOfType,
  findParentNodeOfType as _findParentNodeOfType,
} from 'prosemirror-utils';
import {
  Fragment,
  Slice,
  DOMSerializer,
  MarkType,
  Node,
  NodeType,
  Schema,
  ResolvedPos,
} from 'prosemirror-model';
import { EditorState, Transaction, PluginKey, Plugin } from 'prosemirror-state';
import { Command } from 'prosemirror-commands';
import { EditorView } from 'prosemirror-view';
import { GapCursorSelection } from '../gap-cursor';

export function safeInsert(
  content: Node | Fragment,
  position?: number,
  tryToReplace?: boolean,
): (tr: Transaction) => Transaction {
  return _safeInsert(content, position, tryToReplace);
}

export function removeSelectedNode(tr: Transaction): Transaction {
  return _removeSelectedNode(tr);
}

export const findParentNodeOfType = _findParentNodeOfType;

export function isMarkActiveInSelection(
  type: MarkType,
): (state: EditorState) => boolean {
  return (state) => {
    const { from, $from, to, empty } = state.selection;
    if (empty) {
      return Boolean(type.isInSet(state.tr.storedMarks || $from.marks()));
    }
    return Boolean(state.doc.rangeHasMark(from, to, type));
  };
}

export const validPos = (pos: number, doc: Node) =>
  Number.isInteger(pos) && pos >= 0 && pos < doc.content.size;

export const validListParent = (
  type: NodeType,
  schemaNodes: Schema['nodes'],
) => {
  const { bulletList, orderedList } = schemaNodes;
  return [bulletList, orderedList].includes(type);
};

// TODO document this, probably gets the attributes of the mark of the current selection
export function getMarkAttrs(editorState: EditorState, type: MarkType) {
  const { from, to } = editorState.selection;
  let marks: Node['marks'] = [];

  editorState.doc.nodesBetween(from, to, (node) => {
    marks = [...marks, ...node.marks];
  });

  const mark = marks.find((markItem) => markItem.type.name === type.name);

  return mark ? mark.attrs : {};
}

export function nodeIsActive(
  state: EditorState,
  type: NodeType,
  attrs: Node['attrs'] = {},
) {
  const predicate = (node: Node) => node.type === type;
  const node =
    findSelectedNodeOfType(type)(state.selection) ||
    findParentNode(predicate)(state.selection);

  if (!Object.keys(attrs).length || !node) {
    return !!node;
  }

  return node.node.hasMarkup(type, { ...node.node.attrs, ...attrs });
}

// export function findChangedNodesFromTransaction(tr: Transaction) {
//   const nodes: Node[] = [];
//   const steps = tr.steps || [];
//   steps.forEach((step) => {
//     const { to, from, slice } = step;
//     const size = slice && slice.content ? slice.content.size : 0;
//     for (let i = from; i <= to + size; i++) {
//       if (i <= tr.doc.content.size) {
//         const topLevelNode = tr.doc.resolve(i).node(1);
//         if (topLevelNode && !nodes.find((n) => n === topLevelNode)) {
//           nodes.push(topLevelNode);
//         }
//       }
//     }
//   });
//   return nodes;
// }

/**
 * from atlaskit
 * Returns false if node contains only empty inline nodes and hardBreaks.
 */
export function hasVisibleContent(node: Node) {
  const isInlineNodeHasVisibleContent = (inlineNode: Node) => {
    return inlineNode.isText
      ? !!inlineNode.textContent.trim()
      : inlineNode.type.name !== 'hardBreak';
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
export function isNodeEmpty(node: Node) {
  if (node && node.textContent) {
    return false;
  }
  if (
    !node ||
    !node.childCount ||
    (node.childCount === 1 && isEmptyParagraph(node.firstChild!))
  ) {
    return true;
  }
  const block: Node[] = [];
  const nonBlock: Node[] = [];
  node.forEach((child) => {
    child.isInline ? nonBlock.push(child) : block.push(child);
  });
  return (
    !nonBlock.length &&
    !block.filter(
      (childNode) =>
        (!!childNode.childCount &&
          !(
            childNode.childCount === 1 &&
            isEmptyParagraph(childNode.firstChild!)
          )) ||
        childNode.isAtom,
    ).length
  );
}
/**
 * Checks if a node looks like an empty document
 */
export function isEmptyDocument(node: Node) {
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
export function isEmptyParagraph(node: Node) {
  return (
    !node ||
    (node.type.name === 'paragraph' && !node.textContent && !node.childCount)
  );
}

type PredicateFunction = (state: EditorState, view?: EditorView) => boolean;

// Run predicates: Array<fn(state) -> boolean> and if all
// true, run the command.
export function filter(
  predicates: PredicateFunction | PredicateFunction[],
  cmd: Command,
): Command {
  return (state, dispatch, view) => {
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
// https://github.com/ProseMirror/prosemirror-commands/blob/master/bangle-play/commands.js#L90
// Keep going left up the tree, without going across isolating boundaries, until we
// can go along the tree at that same level
//
// You can think of this as, if you could construct each document like we do in the tests,
// return the position of the first ) backwards from the current selection.
export function findCutBefore($pos: ResolvedPos) {
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

export function isRangeOfType(
  doc: Node,
  $from: ResolvedPos,
  $to: ResolvedPos,
  nodeType: NodeType,
) {
  return (
    getAncestorNodesBetween(doc, $from, $to).filter(
      (node) => node.type !== nodeType,
    ).length === 0
  );
}

/**
 * Returns all top-level ancestor-nodes between $from and $to
 */
export function getAncestorNodesBetween(
  doc: Node,
  $from: ResolvedPos,
  $to: ResolvedPos,
) {
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
export function findAncestorPosition(doc: Node, pos: ResolvedPos) {
  const nestableBlocks = ['blockquote', 'bulletList', 'orderedList'];

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

export const isEmptySelectionAtStart = (state: EditorState) => {
  const { empty, $from } = state.selection;
  return (
    empty &&
    ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection)
  );
};

/**
 * Removes marks from nodes in the current selection that are not supported
 */
export const sanitiseSelectionMarksForWrapping = (
  state: EditorState,
  newParentType: NodeType,
) => {
  let tr: Transaction | null = null;
  let { from, to } = state.tr.selection;

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
          let targetNode = state.doc.nodeAt(position);

          // you cannot set markup for text node
          if (!targetNode || targetNode.isText) {
            return;
          }

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
export const getListLiftTarget = (
  type: NodeType | null | undefined,
  schema: Schema,
  resPos: ResolvedPos,
): number => {
  let target = resPos.depth;
  const { bulletList, orderedList } = schema.nodes;
  let listItem = type;
  if (!listItem) {
    ({ listItem } = schema.nodes);
  }

  for (let i = resPos.depth; i > 0; i--) {
    const node = resPos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      target = i;
    }
    if (
      node.type !== bulletList &&
      node.type !== orderedList &&
      node.type !== listItem
    ) {
      break;
    }
  }
  return target - 1;
};

export function mapChildren<T>(
  node: Node,
  callback: (child: Node, index: number, frag: Fragment) => T,
): T[] {
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

export const isFirstChildOfParent = (state: EditorState): boolean => {
  const { $from } = state.selection;
  return $from.depth > 1
    ? (state.selection instanceof GapCursorSelection &&
        $from.parentOffset === 0) ||
        $from.index($from.depth - 1) === 0
    : true;
};

type MapFragmentCallback = (
  node: Node,
  parent: Node | undefined,
  index: number,
) => Node | Node[] | Fragment | null;

export function mapSlice(slice: Slice, callback: MapFragmentCallback) {
  const fragment = mapFragment(slice.content, callback);
  return new Slice(fragment, slice.openStart, slice.openEnd);
}

export function mapFragment(
  content: Fragment,
  callback: MapFragmentCallback,
  parent?: Node,
  /*: (
    node: Node,
    parent: Node | null,
    index: number,
  ) => Node | Node[] | Fragment | null,*/
): Fragment {
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

export function getFragmentBackingArray(fragment: Fragment) {
  // @types/prosemirror-model doesn't have Fragment.content
  // @ts-ignore
  return fragment.content;
}

/**
 *
 * @param {*} type The schema type of object to create
 * @param {*} placement The placement of the node - above or below
 * @param {*} nestable putting this true will create the
 *            empty node at -1. Set this to true   for nodes
 *             which are nested, for example in:
 *              `<ul> p1 <li> p2 <p>abc</p> p7 </li> p8 <ul>`
 *            we want to insert empty `<li>` above, for which we
 *            will  insert it at pos p1 and not p2. If nested was false,
 *            the function would hav inserted at p2.
 */
export function insertEmpty(
  type: NodeType,
  placement: 'above' | 'below' = 'above',
  nestable: boolean = false,
  attrs: Node['attrs'],
): Command {
  const isAbove = placement === 'above';
  const depth = nestable ? -1 : undefined;
  return (state, dispatch) => {
    const insertPos = isAbove
      ? state.selection.$from.before(depth)
      : state.selection.$from.after(depth);

    const nodeToInsert = type.createAndFill(attrs);

    const tr = state.tr;
    let newTr = safeInsert(nodeToInsert!, insertPos)(state.tr);

    if (tr === newTr) {
      return false;
    }

    if (dispatch) {
      dispatch(newTr.scrollIntoView());
    }

    return true;
  };
}

export function findFirstMarkPosition(
  mark: MarkType,
  doc: Node,
  from: number,
  to: number,
) {
  let markPos = { start: -1, end: -1 };
  doc.nodesBetween(from, to, (node, pos) => {
    // stop recursing if result is found
    if (markPos.start > -1) {
      return false;
    }
    if (markPos.start === -1 && mark.isInSet(node.marks)) {
      markPos = {
        start: pos,
        end: pos + Math.max(node.textContent.length, 1),
      };
    }
  });

  return markPos;
}

/**
 * Creates a plugin which allows for saving of value
 * Helpful for use cases when you just want to store
 * a value in the state and the value will not change
 * over time.
 *
 * Good to know: you get the value by doing `key.getState(state)`
 */
export function valuePlugin<T>(key: PluginKey<T>, value: T): Plugin<T> {
  return new Plugin({
    key,
    state: {
      init() {
        return value;
      },
      apply(_, v) {
        return v;
      },
    },
  });
}

export function toHTMLString(state: EditorState) {
  const div = document.createElement('div');
  const fragment = DOMSerializer.fromSchema(state.schema).serializeFragment(
    state.doc.content,
  );

  div.appendChild(fragment);
  return div.innerHTML;
}

export function extendDispatch(
  dispatch: ((tr: Transaction) => void) | null,
  tapTr: (tr: Transaction) => any,
): ((tr: Transaction) => void) | null {
  return (
    dispatch &&
    ((tr) => {
      if (tr.isGeneric) {
        tapTr(tr);
      }
      dispatch(tr);
    })
  );
}
