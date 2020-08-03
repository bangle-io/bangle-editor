import React, { useEffect } from 'react';
import {
  sinkListItem,
  splitToDefaultListItem,
  liftListItem,
} from 'tiptap-commands';

import { Node } from './node';

const LOG = true;

function log(...args) {
  if (LOG) console.log('todo-item.js', ...args);
}

export class TodoItem extends Node {
  get name() {
    return 'todo_item';
  }

  get defaultOptions() {
    return {
      nested: true,
      nodeViewSetContentDOM: true,
    };
  }

  get schema() {
    return {
      attrs: {
        'data-type': {
          default: this.name,
        },
        'data-done': {
          default: false,
        },
        'class': {
          default: 'flex',
        },
      },
      draggable: true,
      content: this.options.nested ? '(paragraph|todo_list)+' : 'paragraph+',
      toDOM: (node) => {
        const { 'data-done': done } = node.attrs;
        return [
          'li',
          {
            'data-type': this.name,
            'data-done': done.toString(),
          },
          ['span', { class: 'todo-checkbox mr-2', contenteditable: 'false' }],
          ['div', { class: 'todo-content' }, 0],
        ];
      },
      parseDOM: [
        {
          priority: 51,
          tag: `[data-type="${this.name}"]`,
          getAttrs: (dom) => ({
            'data-done': dom.getAttribute('data-done') === 'true',
          }),
        },
      ],
    };
  }

  keys({ type }) {
    return {
      'Enter': splitToDefaultListItem(type),
      'Tab': this.options.nested ? sinkListItem(type) : () => {},
      'Shift-Tab': liftListItem(type),
    };
  }

  nodeViewOptions = {
    wrapperElement: 'li',
  };

  render = (props) => {
    return <TodoItemComp {...props} />;
  };
}

let counter = 0;
function TodoItemComp(props) {
  const { node, view, handleRef, updateAttrs } = props;

  let uid = node.type.name + counter++;

  useEffect(() => {
    log('mounting', uid);
  }, []);

  const { 'data-done': done } = node.attrs;
  return (
    <>
      <span className="todo-checkbox mr-2" contentEditable="false">
        <input
          className="inline-block"
          type="checkbox"
          id={uid}
          name={uid}
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
      <div
        className="todo-content inline-block"
        ref={handleRef}
        data-done={done.toString()}
        contentEditable={view.editable.toString()}
      />
    </>
  );
}
