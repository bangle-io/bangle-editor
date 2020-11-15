import { keymap } from 'prosemirror-keymap';
import { setBlockType, textblockTypeInputRule } from 'tiptap-commands';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import { moveNode } from './list-item/commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};
export const defaultKeys = {
  toCodeBlock: 'Shift-Ctrl-\\',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  insertEmptyAbove: 'Mod-Shift-Enter',
  insertEmptyBelow: 'Mod-Enter',
};

const name = 'code_block';
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
        code_block: { block: 'code_block', noCloseToken: true },
        fence: {
          block: 'code_block',
          getAttrs: (tok) => ({ language: tok.info || '' }),
          noCloseToken: true,
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInCodeBlock = (state) =>
      findParentNodeOfType(type)(state.selection);

    return [
      textblockTypeInputRule(/^```$/, type),
      keymap({
        [keybindings.toCodeBlock]: setBlockType(type),

        [keybindings.moveUp]: moveNode(type, 'UP'),
        [keybindings.moveDown]: moveNode(type, 'DOWN'),

        [keybindings.insertEmptyAbove]: filter(
          isInCodeBlock,
          insertEmpty(schema.nodes.paragraph, 'above', false),
        ),
        [keybindings.insertEmptyBelow]: filter(
          isInCodeBlock,
          insertEmpty(schema.nodes.paragraph, 'below', false),
        ),
      }),
    ];
  };
}
