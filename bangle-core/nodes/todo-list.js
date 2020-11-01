import { wrappingInputRule } from 'prosemirror-inputrules';

import { toggleList } from './list-item/commands';
import { keymap } from 'prosemirror-keymap';

const name = 'todo_list';
const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
  return {
    type: 'node',
    name,
    schema: {
      group: 'block',
      content: 'todo_item+',
      toDOM: () => ['ul', { 'data-type': name }, 0],
      parseDOM: [
        {
          priority: 51,
          tag: `[data-type="${name}"]`,
        },
      ],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => `- `);
      },
      parseMarkdown: {
        todo_list: {
          block: 'todo_list',
        },
      },
    },
  };
};

export const plugins = (opts = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    return [
      wrappingInputRule(/^\s*(\[ \])\s$/, type),
      keymap({
        'Shift-Ctrl-7': toggleList(type, schema.nodes.todo_item),
      }),
    ];
  };
};

const toggleTodoList = (state, dispatch, view) => {
  const { schema } = state;
  return toggleList(schema.nodes.todo_list, schema.nodes.todo_item)(
    state,
    dispatch,
    view,
  );
};

export const todoListCommands = {
  toggleTodoList,
  isSelectionInsideTodoList: (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(
      schema.nodes['todo_item'],
      schema.nodes['todo_list'],
    )(state);
  },
};
