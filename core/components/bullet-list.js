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
          [keybindings.toggleTodo]: toggleTodoList(),
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

// TODO: implemeted two different ways to toggle
// todos, none of them convert bulletList -> todoList directly
export function toggleTodoList2() {
  return (state, dispatch, view) => {
    const result = toggleList(
      state.schema.nodes.bulletList,
      state.schema.nodes.listItem,
      true,
    )(state, dispatch, view);
    return result;
  };
}

export function toggleTodoList() {
  return (state, dispatch, view) => {
    const result = toggleBulletList()(state, dispatch, view);

    if (!result) {
      return false;
    }

    state = view.state;
    const { selection } = state;

    const fromNode = selection.$from.node(-2);
    const endNode = selection.$to.node(-2);

    // make sure the current selection is now bulletList
    if (
      !fromNode ||
      fromNode.type.name !== state.schema.nodes.bulletList.name ||
      !endNode ||
      endNode.type.name !== state.schema.nodes.bulletList.name
    ) {
      // returning true as toggling was still successful
      return true;
    }

    // at this point we have bulletList and we want to set every direct child
    // to todoChecked

    // NOTE: On start end depths start  point to the start of listItems and end points to end of listItems
    // in the current selections parent bulletList.
    // example:  even though selection is between A & B,
    //           the start and end will be * and ~.
    //            <ul>
    //                *<li>[A</li>
    //                <li><B]></li>
    //                <li><C></li>~
    //            </ul>
    const start = selection.$from.start(-2);
    const end = selection.$to.end(-2);

    const parent = selection.$from.node(-2);
    let tr = state.tr;

    tr.doc.nodesBetween(start, end, (node, pos) => {
      // since we only need to iterate through
      // the direct children of bulletList
      if (parent === node) {
        return true;
      }

      if (node.type.name === 'listItem') {
        if (node.attrs.todoChecked == null) {
          tr = tr.setNodeMarkup(
            pos,
            undefined,
            Object.assign({}, node.attrs, { todoChecked: false }),
          );
        }
      }
      // don't dig deeper for any other node
      return false;
    });

    if (dispatch) {
      dispatch(tr);
    }

    return true;
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
