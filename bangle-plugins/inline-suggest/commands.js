import { findFirstMarkPosition } from 'bangle-core/utils/pm-utils';

export const hideTooltipCommand = (tooltipKey) => {
  return (state, dispatch) => {
    const tooltipState = tooltipKey.getState(state);
    if (tooltipState.show) {
      if (dispatch) {
        dispatch(
          state.tr
            .setMeta(tooltipKey, { show: false })
            .setMeta('addToHistory', false),
        );
      }
      return true;
    }
    return false;
  };
};

export const showTooltipCommand = (tooltipKey) => {
  return (state, dispatch) => {
    // const markType = view.state.schema.marks[markName];
    // const query = getQueryText(view.state, markType, trigger);
    // setTooltipContent(query);
    if (dispatch) {
      dispatch(
        state.tr
          .setMeta(tooltipKey, { show: true })
          .setMeta('addToHistory', false),
      );
    }
    return true;
  };
};

export function removeTypeAheadMarkCmd(markName) {
  return (state, dispatch) => {
    const { schema } = state;
    const { from, to } = state.selection;

    const markType = schema.marks[markName];

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
          .removeStoredMark(markType),
      );
    }
    return true;
  };
}
