import { wrappingInputRule } from 'prosemirror-inputrules';

import { Node } from './node';
import { toggleList } from './list-item/commands';
import { parentHasDirectParentOfType } from 'bangle-core/core-commands';

export class BulletList extends Node {
  get name() {
    return 'bullet_list';
  }

  get schema() {
    return {
      content: 'list_item+',
      group: 'block',
      parseDOM: [{ tag: 'ul' }],
      toDOM: () => ['ul', 0],
    };
  }

  get markdown() {
    return {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => (node.attrs.bullet || '-') + ' ');
      },
      parseMarkdown: {
        bullet_list: {
          block: this.name,
        },
      },
    };
  }

  commands({ type, schema }) {
    return { bullet_list: () => toggleList(type, schema.nodes.list_item) };
  }

  keys({ type, schema }) {
    return {
      'Shift-Ctrl-8': toggleList(type, schema.nodes.list_item),
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*([-+*])\s$/, type)];
  }
}

const toggleBulletList = (state, dispatch, view) => {
  return toggleList(
    state.schema.nodes.bullet_list,
    state.schema.nodes.list_item,
  )(state, dispatch, view);
};

export const bulletListCommands = {
  toggleBulletList,
  isSelectionInsideBulletList: (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['list_item'], [
      schema.nodes['bullet_list'],
    ])(state);
  },
};
