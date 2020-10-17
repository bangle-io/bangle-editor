import { wrappingInputRule } from 'prosemirror-inputrules';
import { wrapIn } from 'prosemirror-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { insertEmpty, filter, findParentNodeOfType } from '../utils/pm-utils';

export class Blockquote extends Node {
  get name() {
    return 'blockquote';
  }

  get schema() {
    return {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0],
    };
  }

  get markdown() {
    return {
      toMarkdown: (state, node) => {
        state.wrapBlock('> ', null, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: this.name,
        },
      },
    };
  }

  commands({ type, schema }) {
    const isInBlockquote = (state) =>
      Boolean(findParentNodeOfType(type)(state.selection));

    return filter((state) => !isInBlockquote(state), wrapIn(type));
  }

  keys({ type, schema }) {
    const isInBlockquote = (state) =>
      Boolean(findParentNodeOfType(type)(state.selection));

    return {
      'Ctrl-ArrowRight': filter(
        (state) => !isInBlockquote(state),
        (state, dispatch, view) => {
          return wrapIn(type)(state, dispatch, view);
        },
      ),
      'Alt-ArrowUp': moveNode(type, 'UP'),
      'Alt-ArrowDown': moveNode(type, 'DOWN'),

      'Meta-c': copyEmptyCommand(type),
      'Meta-x': cutEmptyCommand(type),

      'Meta-Shift-Enter': filter(
        isInBlockquote,
        insertEmpty(schema.nodes.paragraph, 'above', true),
      ),
      'Meta-Enter': filter(
        isInBlockquote,
        insertEmpty(schema.nodes.paragraph, 'below', true),
      ),
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*>\s$/, type)];
  }
}
