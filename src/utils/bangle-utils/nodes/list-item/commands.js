import { liftTarget, ReplaceAroundStep } from 'prosemirror-transform';
import * as pmListCommands from 'prosemirror-schema-list';
import * as baseCommand from 'prosemirror-commands';
import { Fragment, Slice } from 'prosemirror-model';
import {
  findParentNodeOfType,
  safeInsert,
  hasParentNodeOfType,
  findPositionOfNodeBefore,
  removeNodeBefore,
  findParentNode,
  replaceSelectedNode,
} from 'prosemirror-utils';
import { Selection, NodeSelection, TextSelection } from 'prosemirror-state';
import { compose } from '../../../../../src/utils/bangle-utils/utils/js-utils';
import {
  hasVisibleContent,
  isNodeEmpty,
  filter,
  findCutBefore,
  isFirstChildOfParent,
  isRangeOfType,
  isEmptySelectionAtStart,
  sanitiseSelectionMarksForWrapping,
  mapChildren,
} from '../../utils/pm-utils';
import { GapCursorSelection } from '../../gap-cursor';
import { liftSelectionList, liftFollowingList } from './transforms';

const maxIndentation = 4;

const _setTextSelection = (position, dir = 1) => (tr) => {
  const nextSelection = Selection.findFrom(tr.doc.resolve(position), dir, true);
  if (nextSelection) {
    return tr.setSelection(nextSelection);
  }
  return tr;
};

// Returns the number of nested lists that are ancestors of the given selection
const numberNestedLists = (resolvedPos, nodes) => {
  const { bullet_list: bulletList, ordered_list: orderedList } = nodes;
  let count = 0;
  for (let i = resolvedPos.depth - 1; i > 0; i--) {
    const node = resolvedPos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      count += 1;
    }
  }
  return count;
};

const isInsideList = (state, listType) => {
  const { $from } = state.selection;
  const parent = $from.node(-2);
  const grandGrandParent = $from.node(-3);

  return (
    (parent && parent.type === state.schema.nodes[listType]) ||
    (grandGrandParent && grandGrandParent.type === state.schema.nodes[listType])
  );
};

const canOutdent = (state) => {
  const { parent } = state.selection.$from;
  const { list_item: listItem, paragraph } = state.schema.nodes;

  if (state.selection instanceof GapCursorSelection) {
    return parent.type === listItem;
  }

  return (
    parent.type === paragraph && hasParentNodeOfType(listItem)(state.selection)
  );
};

/**
 * Check if we can sink the list.
 * @returns {boolean} - true if we can sink the list
 *                    - false if we reach the max indentation level
 */
function canSink(initialIndentationLevel, state) {
  /*
      - Keep going forward in document until indentation of the node is < than the initial
      - If indentation is EVER > max indentation, return true and don't sink the list
      */
  let currentIndentationLevel;
  let currentPos = state.tr.selection.$to.pos;
  do {
    const resolvedPos = state.doc.resolve(currentPos);
    currentIndentationLevel = numberNestedLists(
      resolvedPos,
      state.schema.nodes,
    );
    if (currentIndentationLevel > maxIndentation) {
      // Cancel sink list.
      // If current indentation less than the initial, it won't be
      // larger than the max, and the loop will terminate at end of this iteration
      return false;
    }
    currentPos++;
  } while (currentIndentationLevel >= initialIndentationLevel);
  return true;
}

const isInsideListItem = (state) => {
  const { $from } = state.selection;
  const { list_item: listItem, paragraph } = state.schema.nodes;
  if (state.selection instanceof GapCursorSelection) {
    return $from.parent.type === listItem;
  }
  return (
    hasParentNodeOfType(listItem)(state.selection) &&
    $from.parent.type === paragraph
  );
};

// Get the depth of the nearest ancestor list
const rootListDepth = (pos, nodes) => {
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
    list_item: listItem,
  } = nodes;
  let depth;
  for (let i = pos.depth - 1; i > 0; i--) {
    const node = pos.node(i);
    if (node.type === bulletList || node.type === orderedList) {
      depth = i;
    }
    if (
      node.type !== bulletList &&
      node.type !== orderedList &&
      node.type !== listItem
    ) {
      break;
    }
  }
  return depth;
};

function canToJoinToPreviousListItem(state) {
  const { $from } = state.selection;
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
  } = state.schema.nodes;
  const $before = state.doc.resolve($from.pos - 1);
  let nodeBefore = $before ? $before.nodeBefore : null;
  if (state.selection instanceof GapCursorSelection) {
    nodeBefore = $from.nodeBefore;
  }
  return (
    !!nodeBefore && [bulletList, orderedList].indexOf(nodeBefore.type) > -1
  );
}

/**
 * ------------------
 * Command Factories
 * ------------------
 */

export function toggleList(listType) {
  return (state, dispatch, view) => {
    const { selection } = state;
    const fromNode = selection.$from.node(selection.$from.depth - 2);
    const endNode = selection.$to.node(selection.$to.depth - 2);
    if (
      !fromNode ||
      fromNode.type.name !== listType ||
      !endNode ||
      endNode.type.name !== listType
    ) {
      return toggleListCommand(listType)(state, dispatch, view);
    } else {
      const depth = rootListDepth(selection.$to, state.schema.nodes);

      let tr = liftFollowingList(
        state,
        selection.$to.pos,
        selection.$to.end(depth),
        depth || 0,
        state.tr,
      );
      tr = liftSelectionList(state, tr);

      dispatch(tr);
      return true;
    }
  };
}

function toggleListCommand(listType) {
  return function (state, dispatch, view) {
    if (dispatch) {
      dispatch(
        state.tr.setSelection(
          adjustSelectionInList(state.doc, state.selection),
        ),
      );
    }
    if (!view) {
      return false;
    }

    state = view.state;

    const { $from, $to } = state.selection;
    const isRangeOfSingleType = isRangeOfType(
      state.doc,
      $from,
      $to,
      state.schema.nodes[listType],
    );

    if (isInsideList(state, listType) && isRangeOfSingleType) {
      // Untoggles list
      return liftListItems()(state, dispatch);
    } else {
      // Converts list type e.g. bullet_list -> ordered_list if needed
      if (!isRangeOfSingleType) {
        liftListItems()(state, dispatch);
        state = view.state;
      }

      // Remove any invalid marks that are not supported
      const tr = sanitiseSelectionMarksForWrapping(
        state,
        state.schema.nodes[listType],
      );
      if (tr && dispatch) {
        dispatch(tr);
        state = view.state;
      }
      // Wraps selection in list
      return wrapInList(state.schema.nodes[listType])(state, dispatch);
    }
  };
}

function wrapInList(nodeType) {
  return baseCommand.autoJoin(
    pmListCommands.wrapInList(nodeType),
    (before, after) => before.type === after.type && before.type === nodeType,
  );
}

function liftListItems() {
  return function (state, dispatch) {
    const { tr } = state;
    const { $from, $to } = state.selection;

    tr.doc.nodesBetween($from.pos, $to.pos, (node, pos) => {
      // Following condition will ensure that block types paragraph, heading, codeBlock, blockquote, panel are lifted.
      // isTextblock is true for paragraph, heading, codeBlock.
      if (node.isTextblock) {
        const sel = new NodeSelection(tr.doc.resolve(tr.mapping.map(pos)));
        const range = sel.$from.blockRange(sel.$to);

        if (!range || sel.$from.parent.type !== state.schema.nodes.list_item) {
          return false;
        }

        const target = range && liftTarget(range);

        if (target === undefined || target === null) {
          return false;
        }

        tr.lift(range, target);
      }
      return;
    });

    if (dispatch) {
      dispatch(tr);
    }

    return true;
  };
}

/**
 * Sometimes a selection in the editor can be slightly offset, for example:
 * it's possible for a selection to start or end at an empty node at the very end of
 * a line. This isn't obvious by looking at the editor and it's likely not what the
 * user intended - so we need to adjust the selection a bit in scenarios like that.
 */
function adjustSelectionInList(doc, selection) {
  let { $from, $to } = selection;

  const isSameLine = $from.pos === $to.pos;

  let startPos = $from.pos;
  let endPos = $to.pos;

  if (isSameLine && startPos === doc.nodeSize - 3) {
    // Line is empty, don't do anything
    return selection;
  }

  // Selection started at the very beginning of a line and therefor points to the previous line.
  if ($from.nodeBefore && !isSameLine) {
    startPos++;
    let node = doc.nodeAt(startPos);
    while (!node || (node && !node.isText)) {
      startPos++;
      node = doc.nodeAt(startPos);
    }
  }

  if (endPos === startPos) {
    return new TextSelection(doc.resolve(startPos));
  }

  return new TextSelection(doc.resolve(startPos), doc.resolve(endPos));
}

export function indentList() {
  return function indentListCommand(state, dispatch) {
    const { list_item: listItem } = state.schema.nodes;
    if (isInsideListItem(state)) {
      // Record initial list indentation
      const initialIndentationLevel = numberNestedLists(
        state.selection.$from,
        state.schema.nodes,
      );
      if (canSink(initialIndentationLevel, state)) {
        pmListCommands.sinkListItem(listItem)(state, dispatch);
      }
      return true;
    }
    return false;
  };
}

export function outdentList() {
  return function (state, dispatch) {
    const { list_item: listItem } = state.schema.nodes;
    const { $from, $to } = state.selection;
    if (isInsideListItem(state)) {
      // if we're backspacing at the start of a list item, unindent it
      // take the the range of nodes we might be lifting

      // the predicate is for when you're backspacing a top level list item:
      // we don't want to go up past the doc node, otherwise the range
      // to clear will include everything
      let range = $from.blockRange(
        $to,
        (node) => node.childCount > 0 && node.firstChild.type === listItem,
      );
      if (!range) {
        return false;
      }

      return compose(
        mergeLists(listItem, range), // 2. Check if I need to merge nearest list
        pmListCommands.liftListItem, // 1. First lift list item
      )(listItem)(state, dispatch);
    }

    return false;
  };
}

/**
 * Merge closest bullet list blocks into one
 *
 * @param {NodeType} listItem
 * @param {NodeRange} range
 * @returns
 */
function mergeLists(listItem, range) {
  return (command) => {
    return (state, dispatch) =>
      command(state, (tr) => {
        /* we now need to handle the case that we lifted a sublist out,
         * and any listItems at the current level get shifted out to
         * their own new list; e.g.:
         *
         * unorderedList
         *  listItem(A)
         *  listItem
         *    unorderedList
         *      listItem(B)
         *  listItem(C)
         *
         * becomes, after unindenting the first, top level listItem, A:
         *
         * content of A
         * unorderedList
         *  listItem(B)
         * unorderedList
         *  listItem(C)
         *
         * so, we try to merge these two lists if they're of the same type, to give:
         *
         * content of A
         * unorderedList
         *  listItem(B)
         *  listItem(C)
         */
        const $start = state.doc.resolve(range.start);
        const $end = state.doc.resolve(range.end);
        const $join = tr.doc.resolve(tr.mapping.map(range.end - 1));
        if (
          $join.nodeBefore &&
          $join.nodeAfter &&
          $join.nodeBefore.type === $join.nodeAfter.type
        ) {
          if (
            $end.nodeAfter &&
            $end.nodeAfter.type === listItem &&
            $end.parent.type === $start.parent.type
          ) {
            tr.join($join.pos);
          }
        }
        if (dispatch) {
          dispatch(tr.scrollIntoView());
        }
      });
  };
}

// Chaining runs each command until one of them returns true
export const backspaceKeyCommand = baseCommand.chainCommands(
  // if we're at the start of a list item, we need to either backspace
  // directly to an empty list item above, or outdent this node
  filter(
    [
      isEmptySelectionAtStart,

      // list items might have multiple paragraphs; only do this at the first one
      isFirstChildOfParent,
      canOutdent,
    ],
    baseCommand.chainCommands(deletePreviousEmptyListItem, outdentList()),
  ),

  // if we're just inside a paragraph node (or gapcursor is shown) and backspace, then try to join
  // the text to the previous list item, if one exists
  filter(
    [isEmptySelectionAtStart, canToJoinToPreviousListItem],
    joinToPreviousListItem,
  ),
);

export function enterKeyCommand(state, dispatch) {
  const { selection } = state;
  if (selection.empty) {
    const { $from } = selection;
    const { list_item: listItem, code_block: codeBlock } = state.schema.nodes;
    const node = $from.node($from.depth);
    const wrapper = $from.node($from.depth - 1);
    if (wrapper && wrapper.type === listItem) {
      /** Check if the wrapper has any visible content */
      const wrapperHasContent = hasVisibleContent(wrapper);
      if (isNodeEmpty(node) && !wrapperHasContent) {
        return outdentList('keyboard')(state, dispatch);
      } else if (!hasParentNodeOfType(codeBlock)(selection)) {
        return splitListItem(listItem)(state, dispatch);
      }
    }
  }
  return false;
}

/***
 * Implementation taken from PM and mk-2
 * Splits the list items, specific implementation take from PM
 */
function splitListItem(itemType) {
  return function (state, dispatch) {
    const ref = state.selection;
    const $from = ref.$from;
    const $to = ref.$to;
    const node = ref.node;
    if ((node && node.isBlock) || $from.depth < 2 || !$from.sameParent($to)) {
      return false;
    }
    const grandParent = $from.node(-1);
    if (grandParent.type !== itemType) {
      return false;
    }
    /** --> The following line changed from the original PM implementation to allow list additions with multiple paragraphs */
    if (
      grandParent.content.content.length <= 1 &&
      $from.parent.content.size === 0 &&
      !(grandParent.content.size === 0)
    ) {
      // In an empty block. If this is a nested list, the wrapping
      // list item should be split. Otherwise, bail out and let next
      // command handle lifting.
      if (
        $from.depth === 2 ||
        $from.node(-3).type !== itemType ||
        $from.index(-2) !== $from.node(-2).childCount - 1
      ) {
        return false;
      }
      if (dispatch) {
        let wrap = Fragment.empty;
        const keepItem = $from.index(-1) > 0;
        // Build a fragment containing empty versions of the structure
        // from the outer list item to the parent node of the cursor
        for (
          let d = $from.depth - (keepItem ? 1 : 2);
          d >= $from.depth - 3;
          d--
        ) {
          wrap = Fragment.from($from.node(d).copy(wrap));
        }
        // Add a second list item with an empty default start node
        wrap = wrap.append(Fragment.from(itemType.createAndFill()));
        const tr$1 = state.tr.replace(
          $from.before(keepItem ? undefined : -1),
          $from.after(-3),
          new Slice(wrap, keepItem ? 3 : 2, 2),
        );
        tr$1.setSelection(
          state.selection.constructor.near(
            tr$1.doc.resolve($from.pos + (keepItem ? 3 : 2)),
          ),
        );
        dispatch(tr$1.scrollIntoView());
      }
      return true;
    }
    const nextType =
      $to.pos === $from.end()
        ? grandParent.contentMatchAt(0).defaultType
        : undefined;
    const tr = state.tr.delete($from.pos, $to.pos);
    const types = nextType && [undefined, { type: nextType }];
    if (dispatch) {
      dispatch(tr.split($from.pos, 2, types).scrollIntoView());
    }
    return true;
  };
}

function joinToPreviousListItem(state, dispatch) {
  const { $from } = state.selection;
  const {
    paragraph,
    list_item: listItem,
    code_block: codeBlock,
    bullet_list: bulletList,
    ordered_list: orderedList,
  } = state.schema.nodes;
  const isGapCursorShown = state.selection instanceof GapCursorSelection;
  const $cutPos = isGapCursorShown ? state.doc.resolve($from.pos + 1) : $from;
  let $cut = findCutBefore($cutPos);
  if (!$cut) {
    return false;
  }

  // see if the containing node is a list
  if (
    $cut.nodeBefore &&
    [bulletList, orderedList].indexOf($cut.nodeBefore.type) > -1
  ) {
    // and the node after this is a paragraph or a codeBlock
    if (
      $cut.nodeAfter &&
      ($cut.nodeAfter.type === paragraph || $cut.nodeAfter.type === codeBlock)
    ) {
      // find the nearest paragraph that precedes this node
      let $lastNode = $cut.doc.resolve($cut.pos - 1);

      while ($lastNode.parent.type !== paragraph) {
        $lastNode = state.doc.resolve($lastNode.pos - 1);
      }

      let { tr } = state;
      if (isGapCursorShown) {
        const nodeBeforePos = findPositionOfNodeBefore(tr.selection);
        if (typeof nodeBeforePos !== 'number') {
          return false;
        }
        // append the codeblock to the list node
        const list = $cut.nodeBefore.copy(
          $cut.nodeBefore.content.append(
            Fragment.from(listItem.createChecked({}, $cut.nodeAfter)),
          ),
        );
        tr.replaceWith(
          nodeBeforePos,
          $from.pos + $cut.nodeAfter.nodeSize,
          list,
        );
      } else {
        // take the text content of the paragraph and insert after the paragraph up until before the the cut
        tr = state.tr.step(
          new ReplaceAroundStep(
            $lastNode.pos,
            $cut.pos + $cut.nodeAfter.nodeSize,
            $cut.pos + 1,
            $cut.pos + $cut.nodeAfter.nodeSize - 1,
            state.tr.doc.slice($lastNode.pos, $cut.pos),
            0,
            true,
          ),
        );
      }

      // find out if there's now another list following and join them
      // as in, [list, p, list] => [list with p, list], and we want [joined list]
      let $postCut = tr.doc.resolve(
        tr.mapping.map($cut.pos + $cut.nodeAfter.nodeSize),
      );
      if (
        $postCut.nodeBefore &&
        $postCut.nodeAfter &&
        $postCut.nodeBefore.type === $postCut.nodeAfter.type &&
        [bulletList, orderedList].indexOf($postCut.nodeBefore.type) > -1
      ) {
        tr = tr.join($postCut.pos);
      }

      if (dispatch) {
        dispatch(tr.scrollIntoView());
      }
      return true;
    }
  }

  return false;
}

function deletePreviousEmptyListItem(state, dispatch) {
  const { $from } = state.selection;
  const { list_item: listItem } = state.schema.nodes;
  const $cut = findCutBefore($from);
  if (!$cut || !$cut.nodeBefore || !($cut.nodeBefore.type === listItem)) {
    return false;
  }

  const previousListItemEmpty =
    $cut.nodeBefore.childCount === 1 &&
    $cut.nodeBefore.firstChild.nodeSize <= 2;
  if (previousListItemEmpty) {
    const { tr } = state;
    if (dispatch) {
      dispatch(
        tr
          .delete($cut.pos - $cut.nodeBefore.nodeSize, $from.pos)
          .scrollIntoView(),
      );
    }
    return true;
  }
  return false;
}

export function cutEmptyCommand() {
  return (state, dispatch) => {
    if (!state.selection.empty || !isInsideListItem(state)) {
      return false;
    }
    const { list_item: listItem } = state.schema.nodes;

    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!parent) {
      return false;
    }

    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos));

    dispatch(tr);

    document.execCommand('cut');

    return true;
  };
}

export function copyEmptyCommand() {
  return (state, dispatch) => {
    if (!state.selection.empty || !isInsideListItem(state)) {
      return false;
    }
    const { list_item: listItem } = state.schema.nodes;

    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!parent) {
      return false;
    }

    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos));

    dispatch(tr);

    document.execCommand('copy');

    return true;
  };
}

// WIP
export function moveList(type, down = false) {
  return (state, dispatch) => {
    const {
      bullet_list: bulletList,
      ordered_list: orderedList,
    } = state.schema.nodes;

    // const resolvedPos = state.doc.resolve(state.tr.selection.$from.pos);
    if (!isInsideListItem(state)) {
      return false;
    }

    const grandParent = findParentNode((node) =>
      [bulletList, orderedList].includes(node.type),
    )(state.selection);
    const listItem = findParentNodeOfType(type)(state.selection);

    if (
      !grandParent.node ||
      grandParent.node.childCount === 1 ||
      !listItem.node
    ) {
      return false;
    }

    const arr = mapChildren(grandParent.node, (node) => node);

    let index = arr.indexOf(listItem.node);
    let swapWith = down ? index + 1 : index - 1;
    if (swapWith >= arr.length || swapWith < 0) {
      return false;
    }
    const swapWithNodeSize = arr[swapWith].nodeSize;

    [arr[index], arr[swapWith]] = [arr[swapWith], arr[index]];

    const rearrangedFragment = Fragment.from(arr);
    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, grandParent.pos));
    const $from = state.selection.$from;
    const newGrandParent = grandParent.node.copy(rearrangedFragment);
    tr = replaceSelectedNode(newGrandParent)(tr);
    tr = tr.setSelection(
      Selection.near(
        tr.doc.resolve(
          down ? $from.pos + swapWithNodeSize : $from.pos - swapWithNodeSize,
        ),
      ),
    );
    dispatch(tr);
    return true;
  };
}
