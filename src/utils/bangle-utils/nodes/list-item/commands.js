import { liftTarget, ReplaceAroundStep } from 'prosemirror-transform';
import * as pmListCommands from 'prosemirror-schema-list';
import * as baseCommand from 'prosemirror-commands';
import { Fragment, Slice } from 'prosemirror-model';
import {
  findParentNodeOfType,
  safeInsert,
  hasParentNodeOfType,
  findPositionOfNodeBefore,
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
  validPos,
  validListParent,
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
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
    todo_list: todoList,
  } = nodes;
  let count = 0;
  for (let i = resolvedPos.depth - 1; i > 0; i--) {
    const node = resolvedPos.node(i);
    if (
      node.type === bulletList ||
      node.type === orderedList ||
      node.type === todoList
    ) {
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
    (parent && parent.type === listType) ||
    (grandGrandParent && grandGrandParent.type === listType)
  );
};

const canOutdent = (type) => (state) => {
  const { parent } = state.selection.$from;
  let listItem = type;
  if (!listItem) {
    ({ list_item: listItem } = state.schema.nodes);
  }
  const { paragraph } = state.schema.nodes;

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

export const isInsideListItem = (type) => (state) => {
  const { $from } = state.selection;

  let listItem = type;
  if (!listItem) {
    ({ list_item: listItem } = state.schema.nodes);
  }
  const { paragraph } = state.schema.nodes;
  if (state.selection instanceof GapCursorSelection) {
    return $from.parent.type === listItem;
  }
  return (
    hasParentNodeOfType(listItem)(state.selection) &&
    $from.parent.type === paragraph
  );
};

// Get the depth of the nearest ancestor list
const rootListDepth = (type, pos, nodes) => {
  let listItem = type;

  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
    todo_list: todoList,
  } = nodes;
  let depth;
  for (let i = pos.depth - 1; i > 0; i--) {
    const node = pos.node(i);
    if (
      node.type === bulletList ||
      node.type === orderedList ||
      node.type === todoList
    ) {
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
    todo_list: todoList,
  } = state.schema.nodes;
  const $before = state.doc.resolve($from.pos - 1);
  let nodeBefore = $before ? $before.nodeBefore : null;
  if (state.selection instanceof GapCursorSelection) {
    nodeBefore = $from.nodeBefore;
  }
  return (
    !!nodeBefore &&
    [bulletList, orderedList, todoList].indexOf(nodeBefore.type) > -1
  );
}

/**
 * ------------------
 * Command Factories
 * ------------------
 */

/**
 *
 * @param {Object} listType  bullet_list, ordered_list, todo_list
 * @param {Object} itemType  'todo_item', 'list_item'
 */
export function toggleList(listType, itemType) {
  return (state, dispatch, view) => {
    const { selection } = state;
    const fromNode = selection.$from.node(selection.$from.depth - 2);
    const endNode = selection.$to.node(selection.$to.depth - 2);

    if (
      !fromNode ||
      fromNode.type.name !== listType.name ||
      !endNode ||
      endNode.type.name !== listType.name
    ) {
      return toggleListCommand(listType)(state, dispatch, view);
    } else {
      // If current ListType is the same as `listType` in arg,
      // toggle the list to `p`.
      const listItem = itemType ? itemType : state.schema.nodes.list_item;

      const depth = rootListDepth(listItem, selection.$to, state.schema.nodes);

      let tr = liftFollowingList(
        listItem,
        state,
        selection.$to.pos,
        selection.$to.end(depth),
        depth || 0,
        state.tr,
      );
      tr = liftSelectionList(listItem, state, tr);
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
    const isRangeOfSingleType = isRangeOfType(state.doc, $from, $to, listType);

    if (isInsideList(state, listType) && isRangeOfSingleType) {
      return liftListItems()(state, dispatch);
    } else {
      // Converts list type e.g. bullet_list -> ordered_list if needed
      if (!isRangeOfSingleType) {
        liftListItems()(state, dispatch);
        state = view.state;
      }

      // Remove any invalid marks that are not supported
      const tr = sanitiseSelectionMarksForWrapping(state, listType);
      if (tr && dispatch) {
        dispatch(tr);
        state = view.state;
      }
      // Wraps selection in list
      return wrapInList(listType)(state, dispatch);
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

        if (
          !range ||
          ![
            state.schema.nodes.list_item,
            state.schema.nodes.todo_item,
          ].includes(sel.$from.parent.type)
        ) {
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

export function indentList(type) {
  return function indentListCommand(state, dispatch) {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    if (isInsideListItem(listItem)(state)) {
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

export function outdentList(type) {
  return function (state, dispatch) {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }
    const { $from, $to } = state.selection;
    if (isInsideListItem(listItem)(state)) {
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

const isGrandParentTodoList = (state) => {
  const { $from } = state.selection;
  const grandParent = $from.node($from.depth - 4);
  const { todo_list: todoList } = state.schema.nodes;
  return grandParent.type === todoList;
};

const isParentBulletOrOrderedList = (state) => {
  const { $from } = state.selection;
  const parent = $from.node($from.depth - 2);
  const {
    bullet_list: bulletList,
    ordered_list: orderedList,
  } = state.schema.nodes;
  return [bulletList, orderedList].includes(parent.type);
};

// Chaining runs each command until one of them returns true
export const backspaceKeyCommand = (type) => (...args) => {
  return baseCommand.chainCommands(
    // check the possibility if a user is backspacing
    // inside a list which is directly nested under a todo list.
    // Input:
    // - [ ] A todo list
    //      1.{<>} First
    // Output:
    // - [ ] A todo list
    // - [ ] {<>} First
    filter(
      [
        isInsideListItem(type),
        isEmptySelectionAtStart,
        isFirstChildOfParent,
        (state) =>
          isGrandParentTodoList(state) && isParentBulletOrOrderedList(state),
        (state) => canOutdent(state.schema.nodes.todo_item)(state),
      ],
      // convert it into a todo list and then outdent it
      (state, dispatch, view) => {
        const result = toggleList(
          state.schema.nodes.todo_list,
          state.schema.nodes.todo_item,
        )(state, dispatch, view);
        if (!result) {
          return false;
        }
        state = view.state;
        return outdentList(state.schema.nodes.todo_item)(state, dispatch, view);
      },
    ),

    // if we're at the start of a list item, we need to either backspace
    // directly to an empty list item above, or outdent this node
    filter(
      [
        isInsideListItem(type),
        isEmptySelectionAtStart,

        // list items might have multiple paragraphs; only do this at the first one
        isFirstChildOfParent,
        canOutdent(type),
      ],
      baseCommand.chainCommands(
        deletePreviousEmptyListItem(type),
        outdentList(type),
      ),
    ),

    // if we're just inside a paragraph node (or gapcursor is shown) and backspace, then try to join
    // the text to the previous list item, if one exists
    filter(
      [isEmptySelectionAtStart, canToJoinToPreviousListItem],
      joinToPreviousListItem(type),
    ),
  )(...args);
};

export function enterKeyCommand(type) {
  return (state, dispatch) => {
    const { selection } = state;
    if (selection.empty) {
      const { $from } = selection;
      let listItem = type;
      if (!listItem) {
        ({ list_item: listItem } = state.schema.nodes);
      }
      const { code_block: codeBlock } = state.schema.nodes;

      const node = $from.node($from.depth);
      const wrapper = $from.node($from.depth - 1);
      if (wrapper && wrapper.type === listItem) {
        /** Check if the wrapper has any visible content */
        const wrapperHasContent = hasVisibleContent(wrapper);
        if (isNodeEmpty(node) && !wrapperHasContent) {
          return outdentList(listItem)(state, dispatch);
        } else if (!hasParentNodeOfType(codeBlock)(selection)) {
          return splitListItem(listItem)(state, dispatch);
        }
      }
    }
    return false;
  };
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

function joinToPreviousListItem(type) {
  return (state, dispatch) => {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    const { $from } = state.selection;
    const {
      paragraph,
      code_block: codeBlock,
      bullet_list: bulletList,
      ordered_list: orderedList,
      todo_list: todoList,
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
      [bulletList, orderedList, todoList].indexOf($cut.nodeBefore.type) > -1
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
          [bulletList, orderedList, todoList].indexOf(
            $postCut.nodeBefore.type,
          ) > -1
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
  };
}

function deletePreviousEmptyListItem(type) {
  return (state, dispatch) => {
    const { $from } = state.selection;
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }
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
  };
}

export function cutEmptyCommand(type) {
  return (state, dispatch) => {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    if (!state.selection.empty || !isInsideListItem(listItem)(state)) {
      return false;
    }

    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!parent || !parent.node) {
      return false;
    }

    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos));

    if (dispatch) {
      dispatch(tr);
    }

    document.execCommand('cut');

    return true;
  };
}

export function copyEmptyCommand(type) {
  return (state, dispatch, view) => {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    if (!state.selection.empty || !isInsideListItem(listItem)(state)) {
      return false;
    }
    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!parent) {
      return false;
    }
    const selection = state.selection;
    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos));

    if (dispatch) {
      dispatch(tr);
    }
    document.execCommand('copy');

    // restore the selection
    const tr2 = view.state.tr;
    if (dispatch)
      dispatch(
        tr2.setSelection(Selection.near(tr2.doc.resolve(selection.$from.pos))),
      );
    return true;
  };
}

export function moveList(type, dir = 'UP') {
  const isDown = dir === 'DOWN';
  return (state, dispatch) => {
    let listItem = type;
    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    if (!isInsideListItem(listItem)(state) || !state.selection.empty) {
      return false;
    }

    const parent = findParentNode((node) =>
      validListParent(node.type, state.schema.nodes),
    )(state.selection);
    const current = findParentNodeOfType(listItem)(state.selection);

    if (!parent.node || !current.node) {
      return false;
    }

    const arr = mapChildren(parent.node, (node) => node);

    let index = arr.indexOf(current.node);

    let swapWith = isDown ? index + 1 : index - 1;
    if (swapWith >= arr.length || swapWith < 0) {
      return moveEdgeListItem(listItem, dir)(state, dispatch);
    }

    const swapWithNodeSize = arr[swapWith].nodeSize;
    [arr[index], arr[swapWith]] = [arr[swapWith], arr[index]];

    const $from = state.selection.$from;
    const newGrandParent = parent.node.copy(Fragment.fromArray(arr));

    let tr = state.tr;
    tr = tr.setSelection(NodeSelection.create(tr.doc, parent.pos));
    tr = replaceSelectedNode(newGrandParent)(tr);
    tr = tr.setSelection(
      Selection.near(
        tr.doc.resolve(
          isDown ? $from.pos + swapWithNodeSize : $from.pos - swapWithNodeSize,
        ),
      ),
    );
    if (dispatch) dispatch(tr);
    return true;
  };
}

function moveEdgeListItem(type, dir = 'UP') {
  const isDown = dir === 'DOWN';
  return (state, dispatch) => {
    let listItem = type;

    if (!listItem) {
      ({ list_item: listItem } = state.schema.nodes);
    }

    if (!isInsideListItem(listItem)(state) || !state.selection.empty) {
      return false;
    }
    const grandParent = findParentNode((node) =>
      validListParent(node.type, state.schema.nodes),
    )(state.selection);
    const parent = findParentNodeOfType(listItem)(state.selection);

    if (!grandParent.node || !parent.node) {
      return false;
    }

    // outdent if the not nested list item i.e. top level
    if (state.selection.$from.depth === 3) {
      return outdentList(listItem)(state, dispatch);
    }

    // If there is only one element, we need to delete the entire
    // bullet_list/ordered_list so as not to leave any empty list behind.
    let nodeToRemove = grandParent.node.childCount === 1 ? grandParent : parent;
    let tr = state.tr.delete(
      nodeToRemove.pos,
      nodeToRemove.pos + nodeToRemove.node.nodeSize,
    );

    // - first // doing a (-1) will move us to end of 'first' hence allowing us to add an item
    // - second  // start(-3) will give 11 which is the start of this list_item,
    //   - third{<>}
    let insertPos = state.selection.$from.start(-3) - 1;

    // when going down move the position by the size of remaining content (after deletion)
    if (isDown) {
      let endPos = state.selection.$from.end(-3);
      insertPos = endPos - nodeToRemove.node.nodeSize;

      const uncleNodePos = endPos + 1;
      let uncle =
        validPos(uncleNodePos, state.doc) && state.doc.nodeAt(uncleNodePos);

      if (uncle && uncle.type === listItem) {
        // Example
        // - first
        // - second
        //   - third{<>}
        // - uncle
        // {x} <== you want to go down here
        insertPos += uncle.nodeSize;
      }
    }

    let nodeToInsert = parent.node;

    // if the grand parent is a todo list
    // we can not simply insert a list_item as todo_list can
    // only accept todo_items
    if (isGrandParentTodoList(state)) {
      nodeToInsert = state.schema.nodes.todo_item.createChecked(
        {},
        nodeToInsert.content,
        nodeToInsert.marks,
      );
    }
    const newTr = safeInsert(nodeToInsert, insertPos)(tr);
    // no change hence dont mutate anything
    if (newTr === tr) {
      return false;
    }
    if (dispatch) dispatch(newTr);
    return true;
  };
}
