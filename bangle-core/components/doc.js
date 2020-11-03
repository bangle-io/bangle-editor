import { TextSelection } from 'prosemirror-state';

const name = 'doc';

export const spec = (opts = {}) => {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: 'block+',
    },
  };
};

export const plugins = (opts = {}) => {
  return ({ schema }) => [];
};

function resolveSelection(state, position) {
  if (state.selection && position === null) {
    return;
  }

  if (position === 'start' || position === undefined) {
    return {
      from: 0,
      to: 0,
    };
  }

  if (position === 'end') {
    const { doc } = state;
    return {
      from: doc.content.size,
      to: doc.content.size,
    };
  }

  return {
    from: position,
    to: position,
  };
}

function minMax(value = 0, min = 0, max = 0) {
  return Math.min(Math.max(parseInt(value, 10), min), max);
}

/**
 *
 * @param {'start'|'end'|{from: number, to:number}|undefined} -
 */
export const focusAtPosition = (position) => {
  return (state, dispatch, view) => {
    if (state.selection && position === null) {
      if (dispatch) {
        view.focus();
      }
      return true;
    }
    const { doc } = state;

    let pos;

    if (
      position &&
      typeof position.start === 'number' &&
      position.end === 'number'
    ) {
    } else if (state.selection && !position) {
      pos = {
        from: state.selection.from,
        to: state.selection.to,
      };
    } else if (position === 'start' || !position) {
      pos = {
        from: 0,
        to: 0,
      };
    } else if (position === 'end') {
      pos = {
        from: doc.content.size,
        to: doc.content.size,
      };
    }

    if (!pos) {
      return false;
    }

    const { from, to } = pos;

    const resolvedFrom = minMax(from, 0, doc.content.size);
    const resolvedEnd = minMax(to, 0, doc.content.size);
    const selection = TextSelection.create(doc, resolvedFrom, resolvedEnd);
    const tr = state.tr.setSelection(selection);

    if (dispatch) {
      dispatch(tr);
      view.focus();
    }

    return true;
  };
};
