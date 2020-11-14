import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { parentHasDirectParentOfType } from '../core-commands';
import { toggleList } from './list-item/commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBulletList,
  isSelectionInsideBulletList,
};

const name = 'bullet_list';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      content: 'list_item+',
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

function pluginsFactory({ keybindings = {} } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keymap({
        'Shift-Ctrl-8': toggleList(type, schema.nodes.list_item),
      }),
      wrappingInputRule(/^\s*([-+*])\s$/, type),
    ];
  };
}

export function toggleBulletList(state, dispatch, view) {
  return toggleList(
    state.schema.nodes.bullet_list,
    state.schema.nodes.list_item,
  )(state, dispatch, view);
}

export function isSelectionInsideBulletList(state) {
  const { schema } = state;
  return parentHasDirectParentOfType(schema.nodes['list_item'], [
    schema.nodes['bullet_list'],
  ])(state);
}
