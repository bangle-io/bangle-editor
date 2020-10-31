import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

const name = 'underline';

const getTypeFromSchema = (schema) => schema.marks[name];

export const spec = (opts = {}) => {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'u',
        },
        {
          style: 'text-decoration',
          getAttrs: (value) => value === 'underline',
        },
      ],
      toDOM: () => ['u', 0],
    },
    markdown: {
      // TODO underline is not a real thing in markdown, what is the best option here?
      // I know this is cheating, but underlines are confusing
      // this moves them italic
      toMarkdown: {
        open: '_',
        close: '_',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
    },
  };
};

export const plugins = ({
  keys = {
    toggleUnderline: 'Mod-u',
  },
} = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markInputRule(/~([^~]+)~$/, type),
      markPasteRule(/~([^~]+)~/g, type),
      keymap({
        [keys.toggleUnderline]: toggleMark(type),
      }),
    ];
  };
};
