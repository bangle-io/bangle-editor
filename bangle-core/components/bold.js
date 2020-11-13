import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBold,
  isBoldActiveInSelection,
};

const name = 'bold';

const getTypeFromSchema = (schema) => schema.marks[name];

function specFactory(opts = {}) {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'strong',
        },
        {
          tag: 'b',
          getAttrs: (node) => node.style.fontWeight !== 'normal' && null,
        },
        {
          style: 'font-weight',
          getAttrs: (value) => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM: () => ['strong', 0],
    },
    markdown: {
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        strong: { mark: 'bold' },
      },
    },
  };
}

function pluginsFactory({
  keybindings = {
    toggleBold: 'Mod-b',
  },
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/(?:\*\*|__)([^*_]+)(?:\*\*|__)/g, type),
      markInputRule(/(?:\*\*|__)([^*_]+)(?:\*\*|__)$/, type),
      keymap({
        [keybindings.toggleBold]: toggleMark(type),
      }),
    ];
  };
}

export function toggleBold(state, dispatch, view) {
  return toggleMark(state.schema.marks.bold)(state, dispatch, view);
}

export function isBoldActiveInSelection(state) {
  return isMarkActiveInSelection(state.schema.marks.bold)(state);
}
