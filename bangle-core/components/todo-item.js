import React from 'react';
import reactDOM from 'react-dom';
import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

import browser from '../utils/browser';
import { uuid, classNames as cx, createElement } from '../utils/js-utils';
import { objUid } from '../utils/object-uid';
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

function log(...args) {
  if (LOG) {
    console.log('todo-item.js', ...args);
  }
}

const name = 'todo_item';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ nested = true } = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        'data-type': {
          default: name,
        },
        'data-done': {
          default: false,
        },
      },
      draggable: true,
      content: nested
        ? '(paragraph) (paragraph | todo_list | bullet_list | ordered_list)*'
        : '(paragraph) (paragraph | bullet_list | ordered_list)*',
      toDOM: (node) => {
        const { 'data-done': done } = node.attrs;
        return [
          'li',
          {
            'data-type': name,
            'data-done': done.toString(),
          },
          ['span', { contenteditable: 'false' }],
          ['div', { class: 'todo-content' }, 0],
        ];
      },
      parseDOM: [
        {
          priority: 51,
          tag: `[data-type="${name}"]`,
          getAttrs: (dom) => ({
            'data-done': dom.getAttribute('data-done') === 'true',
          }),
        },
      ],
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(node.attrs['data-done'] ? '[x] ' : '[ ] ');
        state.renderContent(node);
      },
      parseMarkdown: {
        todo_item: {
          block: 'todo_item',
          getAttrs: (tok) => ({
            'data-name': 'todo_item',
            'data-done': tok.attrGet('isDone') || false,
          }),
        },
      },
    },
  };
}

function pluginsFactory({ nested = true, keybindings = defaultKeys } = {}) {
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
            'data-done': !attrs['data-done'],
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
      new Plugin({
        props: {
          nodeViews: {
            [name]: (node, view, getPos, decorations) => {
              const containerDOM = createElement('li', {
                'data-uuid': 'todo-dom-' + uuid(4),
                'data-type': 'todo_item',
              });
              const contentDOM = createElement('div', {
                class: 'bangle-content',
              });

              const update = (instance, { node, updateAttrs }) => {
                const mobile = browser.ios || browser.android;
                const children = (
                  <div
                    className="bangle-content-mount"
                    ref={(node) => {
                      if (!node) {
                        return;
                      }
                      if (!node.contains(contentDOM)) {
                        node.appendChild(contentDOM);
                      }
                    }}
                  />
                );

                const props = { node, view, updateAttrs };
                if (mobile) {
                  return reactDOM.render(
                    <MobileTodo {...props} children={children} />,
                    containerDOM,
                  );
                }
                return reactDOM.render(
                  <TodoItemComp {...props} children={children} />,
                  containerDOM,
                );
              };
              return new NodeView({
                node,
                view,
                getPos,
                decorations,
                containerDOM,
                contentDOM,
                renderHandlers: {
                  create: update,
                  update: update,
                  destroy: () => {
                    reactDOM.unmountComponentAtNode(containerDOM);
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

function TodoItemComp(props) {
  const { node, view, children, updateAttrs } = props;

  let uid = node.type.name + objUid.get(node);

  const { 'data-done': done } = node.attrs;
  return (
    <>
      <span
        className="todo-checkbox self-start flex-none"
        style={{
          marginRight: '0.5rem',
        }}
        contentEditable={false}
      >
        <input
          className="inline-block"
          type="checkbox"
          id={uid}
          name={uid}
          style={{
            marginTop: '0.450rem',
            outline: 'none',
          }}
          onChange={() => {
            updateAttrs({
              'data-done': !done,
            });
          }}
          checked={!!done}
          disabled={!view.editable}
        />
        <label htmlFor={uid} />
      </span>
      {children}
    </>
  );
}

function MobileTodo(props) {
  const { node, updateAttrs, children } = props;
  const { 'data-done': done } = node.attrs;

  return (
    <div className="flex flex-grow">
      <button
        contentEditable={false}
        style={{
          margin: '10px 8px 10px 8px',
          padding: '20px 36px 20px 36px',
        }}
        className={cx({
          'flex-none': true,
          'bg-green-200': done,
          'bg-yellow-200': !done,
        })}
        onClick={() => {
          updateAttrs({
            'data-done': !done,
          });
        }}
      >
        {done ? '✅' : '🟨'}
      </button>
      {children}
    </div>
  );
}
