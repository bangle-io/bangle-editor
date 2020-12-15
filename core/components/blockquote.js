import { wrappingInputRule } from 'prosemirror-inputrules';
import { wrapIn } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import { copyEmptyCommand, cutEmptyCommand, moveNode } from '../core-commands';
import { insertEmpty, filter, findParentNodeOfType } from '../utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryIsBlockquoteActive,
  wrapInBlockquote,
};
export const defaultKeys = {
  wrapIn: 'Ctrl-ArrowRight',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
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

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInBlockquote = queryIsBlockquoteActive();
    return [
      markdownShortcut && wrappingInputRule(/^\s*>\s$/, type),
      keybindings &&
        keymap({
          [keybindings.wrapIn]: wrapInBlockquote(),
          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),

          [keybindings.emptyCopy]: copyEmptyCommand(type),
          [keybindings.emptyCut]: cutEmptyCommand(type),

          [keybindings.insertEmptyParaAbove]: filter(
            isInBlockquote,
            insertEmpty(schema.nodes.paragraph, 'above', true),
          ),
          [keybindings.insertEmptyParaBelow]: filter(
            isInBlockquote,
            insertEmpty(schema.nodes.paragraph, 'below', true),
          ),
        }),
    ];
  };
}

export function queryIsBlockquoteActive() {
  return (state) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}

export function wrapInBlockquote() {
  return filter(
    (state) => !queryIsBlockquoteActive()(state),
    (state, dispatch, view) => {
      const type = getTypeFromSchema(state.schema);
      return wrapIn(type)(state, dispatch, view);
    },
  );
}
