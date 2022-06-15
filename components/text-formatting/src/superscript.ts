import type { BaseRawMarkSpec, RawPlugins } from '@bangle.dev/core';
import type { Command, Schema } from '@bangle.dev/pm';
import { keymap, toggleMark } from '@bangle.dev/pm';
import {
  assertNotUndefined,
  createObject,
  isMarkActiveInSelection,
} from '@bangle.dev/utils';

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
    const type = state.schema.marks[name];
    assertNotUndefined(type, `Mark ${name} not found in schema`);

    return toggleMark(type)(state, dispatch);
  };
}

export function queryIsSuperscriptActive(): Command {
  return (state) => {
    const type = state.schema.marks[name];
    assertNotUndefined(type, `Mark ${name} not found in schema`);

    return isMarkActiveInSelection(type)(state);
  };
}
