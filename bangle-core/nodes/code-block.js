import { moveNode } from 'bangle-core/nodes/list-item/commands';
import { keymap } from 'prosemirror-keymap';
import { setBlockType, textblockTypeInputRule } from 'tiptap-commands';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';

const name = 'code_block';

const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
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
};

export const plugins = ({ keys = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInCodeBlock = (state) =>
      findParentNodeOfType(type)(state.selection);

    return [
      textblockTypeInputRule(/^```$/, type),
      keymap({
        'Shift-Ctrl-\\': setBlockType(type),

        'Alt-ArrowUp': moveNode(type, 'UP'),
        'Alt-ArrowDown': moveNode(type, 'DOWN'),

        'Meta-Shift-Enter': filter(
          isInCodeBlock,
          insertEmpty(schema.nodes.paragraph, 'above', false),
        ),
        'Meta-Enter': filter(
          isInCodeBlock,
          insertEmpty(schema.nodes.paragraph, 'below', false),
        ),
      }),
    ];
  };
};
