import { Extension } from '../../utils/bangle-utils';

export class Timestamp extends Extension {
  get name() {
    return 'timestamp';
  }

  keys({ type }) {
    return {
      'Ctrl-Shift-5': printDate('medium'),
      'Ctrl-Shift-6': printDate('utc'),
      'Ctrl-Shift-4': printDate('short'),
    };
  }
}

function printDate(type) {
  return function (state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();

    if (!$from.parent.canReplaceWith(index, index, state.schema.nodes.text)) {
      return false;
    }

    if (dispatch) {
      let text;

      if (type === 'medium') {
        const formatter = new Intl.DateTimeFormat('default', {
          dateStyle: 'medium',
          timeStyle: 'medium',
          hour12: false,
        });
        text = '' + formatter.format(new Date().getTime());
      }

      if (type === 'utc') {
        text = '' + new Date().toISOString();
      }

      if (type === 'short') {
        const formatter = new Intl.DateTimeFormat('default', {
          dateStyle: 'medium',
          hour12: false,
        });
        text = '' + formatter.format(new Date().getTime());
      }
      dispatch(state.tr.replaceSelectionWith(state.schema.text(text)));
    }
    return true;
  };
}
