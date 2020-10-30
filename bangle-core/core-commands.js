import { findParentNodeOfType } from 'prosemirror-utils';
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state';
import { arrayify } from './utils/js-utils';
function getParentTextSelection(state, currentDepth) {
  const { $from } = state.selection;
  const parentPos = $from.start(currentDepth);
  let replaceStart = parentPos;
  let replaceEnd = $from.end(currentDepth);

  return TextSelection.create(state.doc, replaceStart, replaceEnd);
}

export function copyEmptyCommand(type) {
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
    const tr2 = view.state.tr;
    if (dispatch) {
      dispatch(
        tr2.setSelection(Selection.near(tr2.doc.resolve(selection.$from.pos))),
      );
    }
    return true;
  };
}

export function cutEmptyCommand(type) {
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
export function parentHasDirectParentOfType(parentType, parentsParentType) {
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

    return parentsParentType.includes(parentsParent.type);
  };
}
