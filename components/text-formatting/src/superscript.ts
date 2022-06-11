import type { Command, Schema } from '@bangle.dev/pm';
import { keymap, toggleMark } from '@bangle.dev/pm';
import { createObject, isMarkActiveInSelection } from '@bangle.dev/utils';
import type { BaseRawMarkSpec, RawPlugins } from '@bangle.dev/core';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleSuperscript,
  queryIsSuperscriptActive,
};
export const defaultKeys = {
  toggleSuperscript: '',
};

const name = 'superscript';

function specFactory(opts = {}): BaseRawMarkSpec {
  return {
    type: 'mark',
    name,
    schema: {
      excludes: 'subscript',
      parseDOM: [{ tag: 'sup' }, { style: 'vertical-align=super' }],
      toDOM: () => ['sup', 0],
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }: { schema: Schema }) => {
    return [
      keybindings &&
        keymap(
          createObject([[keybindings.toggleSuperscript, toggleSuperscript()]]),
        ),
    ];
  };
}

export function toggleSuperscript(): Command {
  return (state, dispatch, view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch);
  };
}

export function queryIsSuperscriptActive(): Command {
  return (state) => isMarkActiveInSelection(state.schema.marks[name])(state);
}
