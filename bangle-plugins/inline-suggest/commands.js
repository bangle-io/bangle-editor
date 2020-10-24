import { isChromeWithSelectionBug } from 'bangle-core/index';
import { findFirstMarkPosition } from 'bangle-core/utils/pm-utils';
import { Fragment, Node } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import { safeInsert } from 'prosemirror-utils';

export function removeTypeAheadMarkCmd(markType) {
  return (state, dispatch) => {
    const { from, to } = state.selection;

    const queryMark = findFirstMarkPosition(markType, state.doc, from - 1, to);

    const { start, end } = queryMark;
    if (
      start === -1 &&
      state.storedMarks &&
      markType.isInSet(state.storedMarks)
    ) {
      if (dispatch) {
        dispatch(state.tr.removeStoredMark(markType));
      }

      return true;
    }

    if (start === -1) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .removeMark(start, end, markType)
          // stored marks are marks which will be carried forward to whatever
          // the user types next, like if current mark
          // is bold, new input continues being bold
          .removeStoredMark(markType)
          // This helps us avoid the case:
          // when a user deleted the trigger/ in '<trigger_mark>/something</trigger_mark>'
          // and then performs undo.
          // If we do not hide this from history, command z will bring
          // us in the state of `<trigger_mark>something<trigger_mark>` without the trigger `/`
          // and seeing this state `tooltipActivatePlugin` plugin will dispatch a new command removing
          // the mark, hence never allowing the user to command z.
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
}

export function selectItemCommand(maybeNode, markName) {
  return (state, dispatch, view) => {
    const { schema } = state;
    const markType = schema.marks[markName];
    const { selection } = state;
    const queryMark = findFirstMarkPosition(
      markType,
      state.doc,
      selection.from - 1,
      selection.to,
    );

    if (!queryMark || queryMark.start === -1) {
      return false;
    }

    const getTr = () => {
      const { start, end } = queryMark;
      let tr = state.tr
        .removeStoredMark(markType)
        .replaceWith(start, end, Fragment.empty);

      if (!maybeNode) {
        return tr;
      }

      const isInputFragment = maybeNode instanceof Fragment;

      let node;
      try {
        node =
          maybeNode instanceof Node || isInputFragment
            ? maybeNode
            : typeof maybeNode === 'string'
            ? state.schema.text(maybeNode)
            : Node.fromJSON(state.schema, maybeNode);
      } catch (e) {
        console.error(e);
        return tr;
      }

      if (node.isText) {
        tr = tr.replaceWith(start, start, node);
      } else if (node.isBlock) {
        tr = safeInsert(node)(tr);
      } else if (node.isInline || isInputFragment) {
        // throw new Error('nup');
        const fragment = isInputFragment
          ? node
          : Fragment.fromArray([node, state.schema.text(' ')]);

        tr = tr.replaceWith(start, start, fragment);
        // This problem affects Chrome v58+. See: https://github.com/ProseMirror/prosemirror/issues/710
        if (isChromeWithSelectionBug) {
          const selection = document.getSelection();
          if (selection) {
            selection.empty();
          }
        }

        // Placing cursor after node + space.
        tr = tr.setSelection(
          Selection.near(tr.doc.resolve(start + fragment.size)),
        );

        return tr;
      }

      return tr;
    };

    const tr = getTr();

    if (dispatch) {
      view.focus();
      dispatch(tr);
    }

    return true;
  };
}
