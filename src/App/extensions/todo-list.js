import { Node } from 'utils/bangle-utils/helper-classes/node';
import { toggleList } from 'utils/bangle-utils/helper-commands/toggle-list';
import { wrappingInputRule } from 'prosemirror-inputrules';

export default class TodoList extends Node {
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
    return () => toggleList(type, schema.nodes.todo_item);
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*(\[ \])\s$/, type)];
  }
}
