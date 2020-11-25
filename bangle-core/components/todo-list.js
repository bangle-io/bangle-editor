import { wrappingInputRule } from 'prosemirror-inputrules';

import { toggleList } from './list-item/commands';
import { keymap } from 'prosemirror-keymap';
import { parentHasDirectParentOfType } from 'bangle-core/core-commands';

const name = 'todo_list';
const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleTodoList,
  queryIsSelectionInsideTodoList,
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-7',
};

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      group: 'block',
      content: 'todo_item+',
      toDOM: () => ['ul', { 'data-bangle-name': name }, 0],
      parseDOM: [
        {
          priority: 51,
          tag: `[data-bangle-name="${name}"]`,
        },
      ],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => `- `);
      },
      parseMarkdown: {
        todo_list: {
          block: name,
        },
      },
    },
  };
}

function pluginsFactory({
  keybindings = defaultKeys,
  markdownShortcut = true,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    return [
      markdownShortcut && wrappingInputRule(/^\s*(\[ \])\s$/, type),
      keymap({
        [keybindings.toggle]: toggleList(type, schema.nodes.todo_item),
      }),
    ];
  };
}

export function toggleTodoList() {
  return (state, dispatch, view) => {
    const { schema } = state;
    return toggleList(schema.nodes[name], schema.nodes.todo_item)(
      state,
      dispatch,
      view,
    );
  };
}

export function queryIsSelectionInsideTodoList() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(
      schema.nodes['todo_item'],
      schema.nodes[name],
    )(state);
  };
}
