import { wrappingInputRule } from 'tiptap-commands';

import { Node } from './node';
import { toggleList } from './list-item/commands';

export class TodoList extends Node {
  get name() {
    return 'todo_list';
  }

  get schema() {
    return {
      group: 'block',
      content: 'todo_item+',
      toDOM: () => ['ul', { 'data-type': this.name }, 0],
      parseDOM: [
        {
          priority: 51,
          tag: `[data-type="${this.name}"]`,
        },
      ],
    };
  }

  commands({ type, schema }) {
    return {
      todo_list: () => toggleList(type, schema.nodes.todo_item),
    };
  }

  keys({ type, schema }) {
    return {
      'Shift-Ctrl-7': toggleList(type, schema.nodes.todo_item),
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*(\[ \])\s$/, type)];
  }
}
