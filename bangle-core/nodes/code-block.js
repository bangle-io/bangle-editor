import {
  toggleBlockType,
  setBlockType,
  textblockTypeInputRule,
} from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';

export class CodeBlock extends Node {
  get name() {
    return 'code_block';
  }

  get schema() {
    return {
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
    };
  }

  get markdown() {
    return {
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
    };
  }

  commands({ type, schema }) {
    return () => toggleBlockType(type, schema.nodes.paragraph);
  }

  keys({ type, schema }) {
    const isInCodeBlock = (state) =>
      findParentNodeOfType(type)(state.selection);

    return {
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
    };
  }

  inputRules({ type }) {
    return [textblockTypeInputRule(/^```$/, type)];
  }
}
