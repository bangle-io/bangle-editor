import { wrappingInputRule } from 'prosemirror-inputrules';
import { wrapIn } from 'prosemirror-commands';

import { moveNode } from './list-item/commands';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { insertEmpty, filter, findParentNodeOfType } from '../utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

const name = 'blockquote';

const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0],
    },
    markdown: {
      toMarkdown: (state, node) => {
        state.wrapBlock('> ', null, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: name,
        },
      },
    },
  };
};

export const plugins = ({ keys = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInBlockquote = (state) =>
      Boolean(findParentNodeOfType(type)(state.selection));
    return [
      wrappingInputRule(/^\s*>\s$/, type),
      keymap({
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
      }),
    ];
  };
};
