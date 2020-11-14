import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import browser from '../utils/browser';
import {
  enterKeyCommand,
  backspaceKeyCommand,
  indentList,
  outdentList,
  updateNodeAttrs,
  moveNode,
  moveEdgeListItem,
} from './list-item/commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
} from '../core-commands';
import { filter, insertEmpty } from '../utils/pm-utils';
import { NodeView } from 'bangle-core/node-view';
import { domSerializationHelpers } from '../dom-serialization-helpers';
import { createElement } from 'bangle-core/utils/js-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

export const defaultKeys = {
  markDone: browser.mac ? 'Ctrl-Enter' : 'Ctrl-I',
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyAbove: 'Mod-Shift-Enter',
  insertEmptyBelow: 'Mod-Enter',
};

const LOG = true;

let log = LOG ? console.log.bind(console, 'todo-item') : () => {};

const name = 'todo_item';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ nested = true, draggable = true } = {}) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tagName: 'li',
    parsingPriority: 51,
    hasContent: true,
  });

  const content = nested
    ? '(paragraph) (paragraph | todo_list | bullet_list | ordered_list)*'
    : '(paragraph) (paragraph | bullet_list | ordered_list)*';

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
          block: 'todo_item',
          getAttrs: (tok) => ({
            'data-name': 'todo_item',
            'done': tok.attrGet('isDone') || false,
          }),
        },
      },
    },
  };
}

function pluginsFactory({
  nested = true,
  nodeView = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    const parentCheck = parentHasDirectParentOfType(
      type,
      schema.nodes['todo_list'],
    );
    return [
      keymap({
        [keybindings.markDone]: filter(
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

        [keybindings.insertEmptyAbove]: filter(
          parentCheck,
          insertEmpty(type, 'above', true),
        ),
        [keybindings.insertEmptyBelow]: filter(
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
              class: 'bangle-todo-item',
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

              instance.containerDOM.appendChild(checkBox);
              instance.containerDOM.appendChild(instance.contentDOM);

              inputElement.addEventListener('input', (e) => {
                log('change event', inputElement.checked);
                updateAttrs({
                  // Fetch latest attrs as the one is outer
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
