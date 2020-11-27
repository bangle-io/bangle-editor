import { markInputRule } from 'bangle-core/utils/mark-input-rule';
import { markPasteRule } from 'bangle-core/utils/mark-paste-rule';
import { toggleMark } from 'prosemirror-commands';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleItalic,
  queryIsItalicActive,
};
export const defaultKeys = {
  toggleItalic: 'Mod-i',
};

const name = 'italic';

const getTypeFromSchema = (schema) => schema.marks[name];

function specFactory(opts = {}) {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
      toDOM: () => ['em', 0],
    },
    markdown: {
      toMarkdown: {
        open: '_',
        close: '_',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        em: { mark: name },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/_([^_]+)_/g, type),
      markPasteRule(/\*([^*]+)\*/g, type),
      markInputRule(/(?:^|[^_])(_([^_]+)_)$/, type),
      markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, type),
      keybindings &&
        keymap({
          [keybindings.toggleItalic]: toggleMark(type),
        }),
    ];
  };
}

export function toggleItalic() {
  return (state, dispatch, view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch, view);
  };
}

export function queryIsItalicActive() {
  return (state) => {
    return isMarkActiveInSelection(state.schema.marks[name])(state);
  };
}
