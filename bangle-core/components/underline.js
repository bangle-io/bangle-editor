import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleUnderline,
  queryIsUnderlineActive,
};
export const defaultKeys = {
  toggleUnderline: 'Mod-u',
};

const name = 'underline';

const getTypeFromSchema = (schema) => schema.marks[name];

function specFactory(opts = {}) {
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
          getAttrs: (value) => value === name,
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
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markInputRule(/~([^~]+)~$/, type),
      markPasteRule(/~([^~]+)~/g, type),
      keybindings &&
        keymap({
          [keybindings.toggleUnderline]: toggleMark(type),
        }),
    ];
  };
}

export function toggleUnderline() {
  return (state, dispatch, view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch, view);
  };
}

export function queryIsUnderlineActive() {
  return (state) => {
    return isMarkActiveInSelection(state.schema.marks[name])(state);
  };
}
