import { toggleMark } from 'prosemirror-commands';
import { isMarkActiveInSelection } from '@bangle.dev/pm-utils';
import { keymap } from 'prosemirror-keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleSubscript,
  queryIsSubscriptActive,
};
export const defaultKeys = {
  toggleSubscript: null,
};

const name = 'subscript';

function specFactory(opts = {}) {
  return {
    type: 'mark',
    name,
    schema: {
      excludes: 'superscript',
      parseDOM: [{ tag: 'sub' }, { style: 'vertical-align=sub' }],
      toDOM: () => ['sub', 0],
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    return [
      keybindings &&
        keymap({
          [keybindings.toggleSubscript]: toggleSubscript(),
        }),
    ];
  };
}

export function toggleSubscript() {
  return (state, dispatch, view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch, view);
  };
}

export function queryIsSubscriptActive() {
  return (state) => isMarkActiveInSelection(state.schema.marks[name])(state);
}
