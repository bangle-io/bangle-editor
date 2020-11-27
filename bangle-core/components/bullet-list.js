import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { parentHasDirectParentOfType } from '../core-commands';
import { toggleList } from './list-item/commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBulletList,
  queryIsSelectionInsideBulletList,
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-8',
};

const name = 'bullet_list';

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
        state.renderList(node, '  ', () => (node.attrs.bullet || '-') + ' ');
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
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleList(type, schema.nodes.listItem),
        }),
      markdownShortcut && wrappingInputRule(/^\s*([-+*])\s$/, type),
    ];
  };
}

export function toggleBulletList() {
  return (state, dispatch, view) => {
    return toggleList(
      state.schema.nodes.bullet_list,
      state.schema.nodes.listItem,
    )(state, dispatch, view);
  };
}

export function queryIsSelectionInsideBulletList() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes['bullet_list'],
    ])(state);
  };
}
