import { keymap } from 'prosemirror-keymap';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { toggleList } from '../nodes/list-item/commands';
import { parentHasDirectParentOfType } from 'bangle-core/core-commands';

const name = 'bullet_list';

const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
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
};

export const plugins = ({ keys = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      keymap({
        'Shift-Ctrl-8': toggleList(type, schema.nodes.list_item),
      }),
      wrappingInputRule(/^\s*([-+*])\s$/, type),
    ];
  };
};

export const toggleBulletList = (state, dispatch, view) => {
  return toggleList(
    state.schema.nodes.bullet_list,
    state.schema.nodes.list_item,
  )(state, dispatch, view);
};

export const isSelectionInsideBulletList = (state) => {
  const { schema } = state;
  return parentHasDirectParentOfType(schema.nodes['list_item'], [
    schema.nodes['bullet_list'],
  ])(state);
};
