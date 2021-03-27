import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveEdgeListItem,
  updateNodeAttrs,
} from './commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
  moveNode,
} from '../../core-commands';
import { filter, insertEmpty } from '../../utils/pm-utils';
import { domSerializationHelpers } from '../../utils/dom-serialization-helpers';
import browser from '../../utils/browser';
import { isNodeTodo, setTodoCheckedAttr } from './todo';
import { listItemNodeViewPlugin } from './list-item-node-view-plugin';

const LOG = false;

let log = LOG ? console.log.bind(console, 'list-item') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  indentListItem,
  outdentListItem,
};
export const defaultKeys = {
  toggleDone: browser.mac ? 'Ctrl-Enter' : 'Ctrl-I',
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyListAbove: 'Mod-Shift-Enter',
  insertEmptyListBelow: 'Mod-Enter',
};

const name = 'listItem';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'li',
    content: 0,
  });

  return {
    type: 'node',
    name,
    schema: {
      content: '(paragraph) (paragraph | bulletList | orderedList)*',
      defining: true,
      draggable: true,
      attrs: {
        todoChecked: {
          default: null,
        },
      },
      toDOM,
      parseDOM,
    },
    markdown: {
      toMarkdown(state, node) {
        if (node.attrs.todoChecked != null) {
          state.write(node.attrs.todoChecked ? '[x] ' : '[ ] ');
        }
        state.renderContent(node);
      },
      parseMarkdown: {
        list_item: {
          block: name,
          getAttrs: (tok) => {
            return {
              todoChecked: tok.attrGet('isDone'),
            };
          },
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys, nodeView = true } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isBulletList = parentHasDirectParentOfType(type, [
      schema.nodes['bulletList'],
      schema.nodes['orderedList'],
    ]);

    const move = (dir) =>
      chainCommands(moveNode(type, dir), (state, dispatch, view) => {
        const node = state.selection.$from.node(-3);
        const isParentTodo = isNodeTodo(node, state.schema);
        const result = moveEdgeListItem(type, dir)(state, dispatch, view);

        if (!result) {
          return false;
        }

        // if parent was a todo convert the moved edge node
        // to todo bullet item
        if (isParentTodo && dispatch) {
          const state = view.state;
          let { tr, schema } = state;
          tr = setTodoCheckedAttr(
            tr,
            schema,
            state.selection.$from.node(-1),
            state.selection.$from.before(-1),
          );
          dispatch(tr);
        }
        return true;
      });

    return [
      keybindings &&
        keymap({
          [keybindings.toggleDone]: filter(
            isBulletList,
            updateNodeAttrs(schema.nodes['listItem'], (attrs) => ({
              ...attrs,
              todoChecked:
                attrs.todoChecked == null ? false : !attrs.todoChecked,
            })),
          ),

          Backspace: backspaceKeyCommand(type),
          Enter: enterKeyCommand(type),
          [keybindings.indent]: indentListItem(),
          [keybindings.outdent]: outdentListItem(),
          [keybindings.moveUp]: filter(isBulletList, move('UP')),
          [keybindings.moveDown]: filter(isBulletList, move('DOWN')),
          [keybindings.emptyCut]: filter(isBulletList, cutEmptyCommand(type)),
          [keybindings.emptyCopy]: filter(isBulletList, copyEmptyCommand(type)),
          [keybindings.insertEmptyListAbove]: chainCommands(
            filter(
              isSelectionInsideTodo,
              insertEmpty(type, 'above', true, { todoChecked: false }),
            ),
            filter(isBulletList, insertEmpty(type, 'above', true)),
          ),

          [keybindings.insertEmptyListBelow]: chainCommands(
            filter(
              isSelectionInsideTodo,
              insertEmpty(type, 'below', true, { todoChecked: false }),
            ),
            filter(isBulletList, insertEmpty(type, 'below', true)),
          ),
        }),

      nodeView && listItemNodeViewPlugin(name),
    ];
  };
}

export function indentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return indentList(type)(state, dispatch, view);
  };
}

export function outdentListItem() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return outdentList(type)(state, dispatch, view);
  };
}

const isSelectionInsideTodo = (state) => {
  return isNodeTodo(state.selection.$from.node(-1), state.schema);
};
