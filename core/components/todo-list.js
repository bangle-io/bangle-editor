import { wrappingInputRule } from 'prosemirror-inputrules';

import { toggleList } from './list-item/commands';
import * as bulletList from './bullet-list';
import { keymap } from 'prosemirror-keymap';
import { parentHasDirectParentOfType } from '../core-commands';

const name = 'todoList';
const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleTodoList,
  queryIsTodoListActive,
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
      content: 'todoItem+',
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
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleList(type, schema.nodes.todoItem),

          // [keybindings.toggle]: toggleList(
          //   schema.nodes.bulletList,
          //   schema.nodes.listItem,
          //   {
          //     todoChecked: false,
          //   },
          // ),
        }),
    ];
  };
}

export function toggleTodoList() {
  return (state, dispatch, view) => {
    const { schema } = state;
    return toggleList(schema.nodes[name], schema.nodes.todoItem)(
      state,
      dispatch,
      view,
    );
  };
  // return bulletList.toggleTodoList();
}

export function queryIsTodoListActive() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(
      schema.nodes['todoItem'],
      schema.nodes[name],
    )(state);
  };
}
