import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import browser from '../utils/browser';
import {
  enterKeyCommand,
  backspaceKeyCommand,
  indentList,
  outdentList,
  updateNodeAttrs,
  moveEdgeListItem,
  queryNodeAttrs,
} from './list-item/commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
  moveNode,
} from '../core-commands';
import { filter, insertEmpty } from '../utils/pm-utils';
import { NodeView } from '@banglejs/core/node-view';
import { domSerializationHelpers } from '../utils/dom-serialization-helpers';
import { createElement } from '@banglejs/core/utils/js-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const defaultKeys = {
  toggleDone: browser.mac ? 'Ctrl-Enter' : 'Ctrl-I',
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyTodoAbove: 'Mod-Shift-Enter',
  insertEmptyTodoBelow: 'Mod-Enter',
};
export const commands = {
  toggleTodoItemDone,
  queryTodoItemAttrs,
};
const LOG = false;

let log = LOG ? console.log.bind(console, 'todo-item') : () => {};

const name = 'todoItem';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ nested = true, draggable = true } = {}) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'li',
    parsingPriority: 51,
    content: 0,
  });

  const content = nested
    ? '(paragraph) (paragraph | todoList | bulletList | orderedList)*'
    : '(paragraph) (paragraph | bulletList | orderedList)*';

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        done: {
          default: false,
        },
      },
      draggable,
      content,
      toDOM,
      parseDOM,
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(node.attrs['done'] ? '[x] ' : '[ ] ');
        state.renderContent(node);
      },
      parseMarkdown: {
        todo_item: {
          block: name,
          getAttrs: (tok) => ({
            'data-name': name,
            'done': tok.attrGet('isDone') || false,
          }),
        },
      },
    },
    options: {
      nested,
    },
  };
}

function pluginsFactory({ nodeView = true, keybindings = defaultKeys } = {}) {
  return ({ schema, specRegistry }) => {
    const { nested } = specRegistry.options[name];
    const type = getTypeFromSchema(schema);
    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    const parentCheck = parentHasDirectParentOfType(
      type,
      schema.nodes['todoList'],
    );
    return [
      keybindings &&
        keymap({
          [keybindings.toggleDone]: filter(
            parentCheck,
            updateNodeAttrs(type, (attrs) => ({
              ...attrs,
              done: !attrs['done'],
            })),
          ),

          Enter: enterKeyCommand(type),
          Backspace: backspaceKeyCommand(type),

          [keybindings.indent]: nested ? indentList(type) : () => {},
          [keybindings.outdent]: outdentList(type),

          [keybindings.moveUp]: filter(parentCheck, move('UP')),
          [keybindings.moveDown]: filter(parentCheck, move('DOWN')),

          [keybindings.emptyCut]: filter(parentCheck, cutEmptyCommand(type)),
          [keybindings.emptyCopy]: filter(parentCheck, copyEmptyCommand(type)),

          [keybindings.insertEmptyTodoAbove]: filter(
            parentCheck,
            insertEmpty(type, 'above', true),
          ),
          [keybindings.insertEmptyTodoBelow]: filter(
            parentCheck,
            insertEmpty(type, 'below', true),
          ),
        }),
      nodeView &&
        NodeView.createPlugin({
          name,
          containerDOM: [
            'li',
            {
              // To style our todo friend different than a regular li
              'data-bangle-name': name,
            },
          ],
          contentDOM: ['span', {}],
          renderHandlers: {
            create: (instance, { attrs, updateAttrs, getPos }) => {
              const checkBox = createElement([
                'span',
                { contentEditable: false },
                [
                  'input',
                  {
                    type: 'checkbox',
                  },
                ],
              ]);
              const inputElement = checkBox.querySelector('input');

              if (attrs['done']) {
                inputElement.setAttribute('checked', '');
              }
              // Connect the two contentDOM and containerDOM
              instance.containerDOM.appendChild(checkBox);
              instance.containerDOM.appendChild(instance.contentDOM);

              inputElement.addEventListener('input', (e) => {
                log('change event', inputElement.checked);
                updateAttrs({
                  // Fetch latest attrs as the one in outer
                  // closure can be stale.
                  done: inputElement.checked,
                });
              });
            },

            // We need to achieve a two way binding of the done state.
            // First binding: dom -> editor : done by  inputElement's `input` event listener
            // Second binding: editor -> dom: Done by the `update` handler below
            update: (instance, { attrs }) => {
              const inputElement = instance.containerDOM.querySelector('input');

              const done = attrs['done'];
              const hasAttribute = inputElement.hasAttribute('checked');
              if (done === hasAttribute) {
                log('skipping update', done, hasAttribute);
                return;
              }
              log('updating inputElement');
              if (done) {
                inputElement.setAttribute('checked', 'true');
              } else {
                inputElement.removeAttribute('checked');
              }
            },

            destroy: () => {},
          },
        }),
    ];
  };
}

export function toggleTodoItemDone() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);

    return updateNodeAttrs(type, (attrs) => ({
      ...attrs,
      done: !attrs['done'],
    }))(state, dispatch, view);
  };
}

export function queryTodoItemAttrs() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);

    const attrs = queryNodeAttrs(type)(state, dispatch, view);
    return attrs;
  };
}
