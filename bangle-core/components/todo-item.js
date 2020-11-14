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
import { Plugin } from 'prosemirror-state';
import { NodeView } from 'bangle-core/node-view';
import { DOMSerializer } from 'prosemirror-model';
import { domSerializationHelpers } from '../dom-serialization-helpers';
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

const LOG = false;

let log = LOG ? console.log.bind(console, 'todo-item') : () => {};

const name = 'todo_item';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ nested = true } = {}) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tagName: 'li',
    parsingPriority: 51,
    hasContent: true,
  });

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        done: {
          default: false,
        },
      },
      draggable: true,
      content: nested
        ? '(paragraph) (paragraph | todo_list | bullet_list | ordered_list)*'
        : '(paragraph) (paragraph | bullet_list | ordered_list)*',

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
        new Plugin({
          props: {
            nodeViews: {
              [name]: (node, view, getPos, decorations) => {
                const isDone = () =>
                  view.state.doc.nodeAt(getPos()).attrs['done'];
                const {
                  dom: containerDOM,
                  contentDOM,
                } = DOMSerializer.renderSpec(window.document, [
                  'li',
                  {
                    'data-type': 'todo_item',
                    'class': 'bangle-todo-item',
                  },
                  [
                    'span',
                    { contentEditable: false },
                    [
                      'input',
                      {
                        type: 'checkbox',
                      },
                    ],
                  ],
                  ['span', { class: 'bangle-content-mount' }, 0],
                ]);

                const inputElement = containerDOM.querySelector('input');

                const create = (instance, { updateAttrs }) => {
                  const done = isDone();
                  if (done) {
                    inputElement.setAttribute('checked', 'true');
                    inputElement.setAttribute('done', 'true');
                  }
                  inputElement.addEventListener('input', (e) => {
                    log('change event');
                    updateAttrs({
                      done: !isDone(),
                    });
                  });
                };

                const update = (instance, { node }) => {
                  const done = isDone();
                  const hasAttribute = inputElement.hasAttribute('checked');
                  if (done === hasAttribute) {
                    log('skipping update', done, hasAttribute);
                    return;
                  }

                  log('updating', node, 'setting to', done);

                  if (done) {
                    inputElement.setAttribute('checked', 'true');
                    inputElement.setAttribute('done', 'true');
                  } else {
                    inputElement.removeAttribute('checked');
                    inputElement.removeAttribute('done');
                  }
                };

                return new NodeView({
                  node,
                  view,
                  getPos,
                  decorations,
                  containerDOM,
                  contentDOM,
                  renderHandlers: {
                    create: create,
                    update: update,
                    destroy: () => {
                      // TODO i think this is unnecessary
                      while (containerDOM.firstChild) {
                        containerDOM.removeChild(containerDOM.lastChild);
                      }
                    },
                  },
                });
              },
            },
          },
        }),
    ];
  };
}
