import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { parentHasDirectParentOfType } from '../core-commands';
import { toggleList } from './list-item/commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBulletList,
  queryIsBulletListActive,
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-8',
  toggleTodo: 'Shift-Ctrl-7',
};

const name = 'bulletList';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      content: 'listItem+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => '- ');
      },
      parseMarkdown: {
        bullet_list: {
          block: name,
        },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  todoMarkdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleList(type, schema.nodes.listItem),
          [keybindings.toggleTodo]: toggleList(
            schema.nodes.bulletList,
            schema.nodes.listItem,
            true,
          ),
        }),
      markdownShortcut && wrappingInputRule(/^\s*([-+*])\s$/, type),
      todoMarkdownShortcut &&
        wrappingInputRule(/^\s*(\[ \])\s$/, schema.nodes.listItem, {
          todoChecked: false,
        }),
    ];
  };
}

export function toggleBulletList() {
  return (state, dispatch, view) => {
    return toggleList(
      state.schema.nodes.bulletList,
      state.schema.nodes.listItem,
    )(state, dispatch, view);
  };
}

export function toggleTodoList() {
  return (state, dispatch, view) => {
    const result = toggleList(
      state.schema.nodes.bulletList,
      state.schema.nodes.listItem,
      true,
    )(state, dispatch, view);
    console.log({ result });
    return result;
  };
}

export function queryIsBulletListActive() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes['bulletList'],
    ])(state);
  };
}

export function queryIsTodoListActive() {
  return (state) => {
    const { schema } = state;

    return (
      parentHasDirectParentOfType(schema.nodes['listItem'], [
        schema.nodes['bulletList'],
      ])(state) &&
      typeof state.selection.$from.node(-1).attrs.todoChecked === 'boolean'
    );
  };
}
