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
  toggleSubscript,
  queryIsSubscriptActive,
};
export const defaultKeys = {
  toggleSubscript: '',
};

const name = 'subscript';

function specFactory(opts = {}): BaseRawMarkSpec {
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

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }: { schema: Schema }) => {
    return [
      keybindings &&
        keymap(
          createObject([[keybindings.toggleSubscript, toggleSubscript()]]),
        ),
    ];
  };
}

export function toggleSubscript(): Command {
  return (state, dispatch, view) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsSubscriptActive(): Command {
  return (state) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return isMarkActiveInSelection(markType)(state);
  };
}
