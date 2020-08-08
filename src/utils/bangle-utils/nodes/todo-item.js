import React, { useEffect } from 'react';
import {
  sinkListItem,
  splitToDefaultListItem,
  liftListItem,
} from 'tiptap-commands';
import { uuid } from '../utils/js-utils';

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
      getContentDOM: () => {
        const d = document.createElement('div');
        d.setAttribute('data-uuid', 'todo-content-dom-' + uuid(4));
        return { dom: d };
      },
      createDomRef: () => {
        const d = document.createElement('li');
        d.setAttribute('data-uuid', 'todo-dom-' + uuid(4));
        return d;
      },
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
          default: 'flex', // TODO using this to set class is a bad idea as this
          // is saved in the HDD and any future ui change will over overriden by the saved class in attribute
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

  render = (props) => {
    return <TodoItemComp {...props} />;
  };
}

let counter = 0;
function TodoItemComp(props) {
  const { node, view, handleRef, updateAttrs } = props;

  let uid = node.type.name + counter++;

  const { 'data-done': done } = node.attrs;
  return (
    <>
      <span className="todo-checkbox mr-2 self-start" contentEditable={false}>
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
      <div
        className="todo-content inline-block"
        ref={handleRef}
        data-done={done.toString()}
      />
    </>
  );
}
