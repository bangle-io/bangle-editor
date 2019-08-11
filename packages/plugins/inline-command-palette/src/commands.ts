import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { findTypeAheadQuery } from './helpers/query';

export type CommandDispatch = (tr: Transaction) => void;
export type Command = (
  state: EditorState,
  dispatch?: CommandDispatch,
  view?: EditorView,
) => boolean;

export const removeTypeAheadMark = (): Command => (state, dispatch) => {
  const queryMark = findTypeAheadQuery(state);

  if (queryMark === null) {
    return false;
  }

  const { start, end } = queryMark;
  const { schema } = state;
  const markType = schema.marks.typeAheadQuery;
  if (start === -1) {
    return false;
  }

  if (dispatch) {
    dispatch(
      state.tr
        .removeMark(start, end, markType)
        // stored marks are marks which will be carried forward to whatever the user types next, like if current mark
        // is bold, new input continues being bold
        .removeStoredMark(markType),
    );
  }
  return true;
};
