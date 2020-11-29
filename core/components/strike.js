import { markInputRule } from '@banglejs/core/utils/mark-input-rule';
import { markPasteRule } from '@banglejs/core/utils/mark-paste-rule';
import { toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { isMarkActiveInSelection } from '@banglejs/core/utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleStrike,
  queryIsStrikeActive,
};
export const defaultKeys = {
  toggleStrike: 'Mod-d',
};

const name = 'strike';

const getTypeFromSchema = (schema) => schema.marks[name];

function specFactory(opts = {}) {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 's',
        },
        {
          tag: 'del',
        },
        {
          tag: 'strike',
        },
        {
          style: 'text-decoration',
          getAttrs: (value) => value === 'line-through',
        },
      ],
      toDOM: () => ['s', 0],
    },
    markdown: {
      toMarkdown: {
        open: '~~',
        close: '~~',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        s: { mark: 'strike' },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/~([^~]+)~/g, type),
      markInputRule(/~([^~]+)~$/, type),
      keybindings &&
        keymap({
          [keybindings.toggleStrike]: toggleMark(type),
        }),
    ];
  };
}

export function toggleStrike() {
  return (state, dispatch, view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch, view);
  };
}

export function queryIsStrikeActive() {
  return (state) => {
    return isMarkActiveInSelection(state.schema.marks[name])(state);
  };
}
