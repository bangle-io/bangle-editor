import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

const name = 'strike';

const getTypeFromSchema = (schema) => schema.marks[name];

export const spec = (opts = {}) => {
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
};

export const plugins = ({
  keybindings = {
    toggleStrike: 'Mod-d',
  },
} = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/~([^~]+)~/g, type),
      markInputRule(/~([^~]+)~$/, type),
      keymap({
        [keybindings.toggleStrike]: toggleMark(type),
      }),
    ];
  };
};
