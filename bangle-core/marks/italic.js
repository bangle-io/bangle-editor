import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

const name = 'italic';

const getTypeFromSchema = (schema) => schema.marks[name];

export const spec = (opts = {}) => {
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
        em: { mark: 'italic' },
      },
    },
  };
};

export const plugins = ({
  keys = {
    toggleItalic: 'Mod-i',
  },
} = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/_([^_]+)_/g, type),
      markPasteRule(/\*([^*]+)\*/g, type),
      markInputRule(/(?:^|[^_])(_([^_]+)_)$/, type),
      markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, type),
      keymap({
        [keys.toggleItalic]: toggleMark(type),
      }),
    ];
  };
};

export const toggleItalic = (state, dispatch, view) => {
  return toggleMark(state.schema.marks.italic)(state, dispatch, view);
};

export const isItalicActiveInSelection = (state) => {
  return isMarkActiveInSelection(state.schema.marks.italic)(state);
};
