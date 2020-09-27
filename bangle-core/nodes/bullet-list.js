import { wrappingInputRule } from 'prosemirror-inputrules';

import { Node } from './node';
import { toggleList } from './list-item/commands';

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

      toMarkdown: (state, node) => {
        state.renderList(node, '  ', () => (node.attrs.bullet || '-') + ' ');
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
