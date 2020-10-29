import { wrappingInputRule } from 'prosemirror-inputrules';

import { Node } from './node';
import { toggleList } from './list-item/commands';
import { rafWrap } from '../utils/js-utils';
import { parentHasDirectParentOfType } from 'bangle-core/core-commands';

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

  get markdown() {
    return {
      toMarkdown(state, node) {
        state.renderList(node, '  ', () => `- `);
      },
      parseMarkdown: {
        todo_list: {
          block: 'todo_list',
        },
      },
    };
  }

  commands({ type, schema }) {
    return {
      // TODO I am not sure why raf fixes the problem,
      // but wrapping it inside an raf seems to avoid the
      // problem of losing focus and getting the selection in wrong place
      todo_list: () => rafWrap(toggleList(type, schema.nodes.todo_item)),
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
