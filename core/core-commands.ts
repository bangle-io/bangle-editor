import { Command } from 'prosemirror-commands';
import { Fragment, Node, NodeType, Slice } from 'prosemirror-model';
import {
  EditorState,
  NodeSelection,
  Selection,
  TextSelection,
} from 'prosemirror-state';
import { ReplaceStep } from 'prosemirror-transform';
import { findParentNodeOfType } from 'prosemirror-utils';
import { MoveDirection } from './types';
import { arrayify } from './utils/js-utils';
import { mapChildren } from './utils/pm-utils';

function getParentTextSelection(state: EditorState, currentDepth: number) {
  const { $from } = state.selection;
  const parentPos = $from.start(currentDepth);
  let replaceStart = parentPos;
  let replaceEnd = $from.end(currentDepth);

  return TextSelection.create(state.doc, replaceStart, replaceEnd);
}

export function copyEmptyCommand(type: NodeType): Command {
  return (state, dispatch, view) => {
    if (!state.selection.empty) {
      return false;
    }
    const current = findParentNodeOfType(type)(state.selection);

    if (!current) {
      return false;
    }

    const selection = state.selection;
    let tr = state.tr;

    tr = tr.setSelection(getParentTextSelection(state, current.depth));

    if (dispatch) {
      dispatch(tr);
    }
    document.execCommand('copy');

    // restore the selection
    const tr2 = view!.state.tr;
    if (dispatch) {
      dispatch(
        tr2.setSelection(Selection.near(tr2.doc.resolve(selection.$from.pos))),
      );
    }
    return true;
  };
}

export function cutEmptyCommand(type: NodeType): Command {
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return false;
    }

    const parent = findParentNodeOfType(type)(state.selection);

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

// Finds a parent node in the ancestors and check if that node has a direct parent of type `parentsParentType`
export function parentHasDirectParentOfType(
  parentType: NodeType,
  parentsParentType: NodeType | NodeType[],
): (state: EditorState) => boolean {
  parentsParentType = arrayify(parentsParentType);

  return (state) => {
    const currentResolved = findParentNodeOfType(parentType)(state.selection);
    if (!currentResolved) {
      return false;
    }

    const depth = currentResolved.depth - 1;
    if (depth < 0) {
      return false;
    }
    const parentsParent = state.selection.$from.node(depth);

    return (parentsParentType as NodeType[]).includes(parentsParent.type);
  };
}

/**
 * Moves a node up and down. Please do a sanity check if the node is allowed to move or not
 * before calling this command.
 *
 * @param {PMNodeType} type The items type
 * @param {['UP', 'DOWN']} dir
 */
export function moveNode(type: NodeType, dir: MoveDirection = 'UP'): Command {
  const isDown = dir === 'DOWN';
  return (state, dispatch) => {
    if (!state.selection.empty) {
      return false;
    }

    const { $from } = state.selection;

    const currentResolved = findParentNodeOfType(type)(state.selection);

    if (!currentResolved) {
      return false;
    }

    const { node: currentNode } = currentResolved;
    const parentDepth = currentResolved.depth - 1;
    const parent = $from.node(parentDepth);
    const parentPos = $from.start(parentDepth);

    if (currentNode.type !== type) {
      return false;
    }

    const arr = mapChildren(parent, (node) => node);
    let index = arr.indexOf(currentNode);

    let swapWith = isDown ? index + 1 : index - 1;

    // If swap is out of bound
    if (swapWith >= arr.length || swapWith < 0) {
      return false;
    }

    const swapWithNodeSize = arr[swapWith]!.nodeSize;
    [arr[index]!, arr[swapWith]!] = [arr[swapWith]!, arr[index]!];

    let tr = state.tr;
    let replaceStart = parentPos;
    let replaceEnd = $from.end(parentDepth);

    const slice = new Slice(Fragment.fromArray(arr), 0, 0); // the zeros  lol -- are not depth they are something that represents the opening closing
    // .toString on slice gives you an idea. for this case we want them balanced
    tr = tr.step(new ReplaceStep(replaceStart, replaceEnd, slice, false));

    tr = tr.setSelection(
      Selection.near(
        tr.doc.resolve(
          isDown ? $from.pos + swapWithNodeSize : $from.pos - swapWithNodeSize,
        ),
      ),
    );
    if (dispatch) {
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

export const setSelectionAtEnd = (node: Node): Command => {
  return (state, dispatch, _view) => {
    let pos = node.nodeSize - 1;
    if (node.type.name === 'doc') {
      pos = node.content.size - 1;
    }
    const tr = state.tr.setSelection(TextSelection.create(state.doc, pos));
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  };
};

export function jumpToStartOfNode(type: NodeType): Command {
  return (state, dispatch) => {
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    if (dispatch) {
      const { start } = current;
      dispatch(state.tr.setSelection(TextSelection.create(state.doc, start)));
    }
    return true;
  };
}

export function jumpToEndOfNode(type: NodeType): Command {
  return (state, dispatch) => {
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    if (dispatch) {
      const { node, start } = current;
      dispatch(
        state.tr.setSelection(
          TextSelection.create(state.doc, start + node.content.size),
        ),
      );
    }
    return true;
  };
}
