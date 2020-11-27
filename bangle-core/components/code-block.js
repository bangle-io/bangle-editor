import { keymap } from 'prosemirror-keymap';
import { setBlockType, textblockTypeInputRule } from 'tiptap-commands';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import { moveNode } from './list-item/commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryIsSelectionInCodeBlock,
};
export const defaultKeys = {
  toCodeBlock: 'Shift-Ctrl-\\',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
};

const name = 'codeBlock';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        language: { default: '' },
      },
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
      toDOM: () => ['pre', ['code', 0]],
    },
    markdown: {
      toMarkdown(state, node) {
        state.write('```' + (node.attrs.language || '') + '\n');
        state.text(node.textContent, false);
        state.ensureNewLine();
        state.write('```');
        state.closeBlock(node);
      },
      parseMarkdown: {
        code_block: { block: name, noCloseToken: true },
        fence: {
          block: name,
          getAttrs: (tok) => ({ language: tok.info || '' }),
          noCloseToken: true,
        },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markdownShortcut && textblockTypeInputRule(/^```$/, type),
      keybindings &&
        keymap({
          [keybindings.toCodeBlock]: setBlockType(type),

          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),

          [keybindings.insertEmptyParaAbove]: filter(
            queryIsSelectionInCodeBlock(),
            insertEmpty(schema.nodes.paragraph, 'above', false),
          ),
          [keybindings.insertEmptyParaBelow]: filter(
            queryIsSelectionInCodeBlock(),
            insertEmpty(schema.nodes.paragraph, 'below', false),
          ),
        }),
    ];
  };
}

export function queryIsSelectionInCodeBlock() {
  return (state) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}
