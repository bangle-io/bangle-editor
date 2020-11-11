import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

const name = 'code';

const getTypeFromSchema = (schema) => schema.marks[name];

export const spec = (opts = {}) => {
  return {
    type: 'mark',
    name,
    schema: {
      excludes: '_',
      parseDOM: [{ tag: 'code' }],
      toDOM: () => ['code', 0],
    },
    markdown: {
      toMarkdown: {
        open(_state, _mark, parent, index) {
          return backticksFor(parent.child(index), -1);
        },
        close(_state, _mark, parent, index) {
          return backticksFor(parent.child(index - 1), 1);
        },
        escape: false,
      },
      parseMarkdown: {
        code_inline: { mark: 'code', noCloseToken: true },
      },
    },
  };
};

export const plugins = ({
  keybindings = {
    toggleCode: 'Mod-`',
  },
} = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/(?:`)([^`]+)(?:`)/g, type),
      markInputRule(/(?:`)([^`]+)(?:`)$/, type),
      keymap({
        [keybindings.toggleCode]: toggleMark(type),
      }),
    ];
  };
};

export const toggleCode = (state, dispatch, view) => {
  return toggleMark(state.schema.marks.code)(state, dispatch, view);
};

export const isCodeActiveInSelection = (state) => {
  return isMarkActiveInSelection(state.schema.marks.code)(state);
};

function backticksFor(node, side) {
  let ticks = /`+/g,
    m,
    len = 0;
  if (node.isText) {
    while ((m = ticks.exec(node.text))) {
      len = Math.max(len, m[0].length);
    }
  }
  let result = len > 0 && side > 0 ? ' `' : '`';
  for (let i = 0; i < len; i++) {
    result += '`';
  }
  if (len > 0 && side < 0) {
    result += ' ';
  }
  return result;
}
