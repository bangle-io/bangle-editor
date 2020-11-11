import { wrappingInputRule } from 'prosemirror-inputrules';
import { wrapIn } from 'prosemirror-commands';

import { moveNode } from './list-item/commands';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { insertEmpty, filter, findParentNodeOfType } from '../utils/pm-utils';
import { keymap } from 'prosemirror-keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

export const defaultKeys = {
  wrapIn: 'Ctrl-ArrowRight',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyAbove: 'Mod-Shift-Enter',
  insertEmptyBelow: 'Mod-Enter',
};

const name = 'blockquote';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
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
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInBlockquote = (state) =>
      Boolean(findParentNodeOfType(type)(state.selection));
    return [
      wrappingInputRule(/^\s*>\s$/, type),
      keymap({
        [keybindings.wrapIn]: filter(
          (state) => !isInBlockquote(state),
          (state, dispatch, view) => {
            return wrapIn(type)(state, dispatch, view);
          },
        ),
        [keybindings.moveUp]: moveNode(type, 'UP'),
        [keybindings.moveDown]: moveNode(type, 'DOWN'),

        [keybindings.emptyCopy]: copyEmptyCommand(type),
        [keybindings.emptyCut]: cutEmptyCommand(type),

        [keybindings.insertEmptyAbove]: filter(
          isInBlockquote,
          insertEmpty(schema.nodes.paragraph, 'above', true),
        ),
        [keybindings.insertEmptyBelow]: filter(
          isInBlockquote,
          insertEmpty(schema.nodes.paragraph, 'below', true),
        ),
      }),
    ];
  };
}
