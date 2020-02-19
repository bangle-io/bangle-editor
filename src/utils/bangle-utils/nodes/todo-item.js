import React from 'react';
import {
  sinkListItem,
  splitToDefaultListItem,
  liftListItem,
} from 'tiptap-commands';

import { CustomNodeView } from '../helper-react/custom-node-view';

import { Node } from './node';
export class TodoItem extends Node {
  get name() {
    return 'todo_item';
  }

  get defaultOptions() {
    return {
      nested: true,
    };
  }

  get schema() {
    return {
      attrs: {
        done: {
          default: false,
        },
      },
      draggable: true,
      content: this.options.nested ? '(paragraph|todo_list)+' : 'paragraph+',
      toDOM: (node) => {
        const { done } = node.attrs;

        return [
          'li',
          {
            'data-type': this.name,
            'data-done': done.toString(),
          },
          ['span', { class: 'todo-checkbox', contenteditable: 'false' }],
          ['div', { class: 'todo-content' }, 0],
        ];
      },
      parseDOM: [
        {
          priority: 51,
          tag: `[data-type="${this.name}"]`,
          getAttrs: (dom) => ({
            done: dom.getAttribute('data-done') === 'true',
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

  nodeView(node, view, getPos) {
    return new CustomNodeView({
      node,
      view,
      getPos,
      extension: this,
      reactComponent: TodoItemComp,
      setContentDOM: true,
    });
  }
}

let counter = 0;
function TodoItemComp(props) {
  const { node, view, handleRef, updateAttrs } = props;
  let uid = node.type.name + counter++;
  return (
    <li data-type={node.type.name} data-done={node.attrs.done.toString()}>
      <span className="todo_checkbox" contentEditable="false">
        <input
          type="checkbox"
          id={uid}
          name={uid}
          onChange={() => {
            updateAttrs({
              done: !node.attrs.done,
            });
          }}
          checked={!!node.attrs.done}
          disabled={!view.editable}
        />
        <label htmlFor={uid} />
      </span>
      <div
        className="todo-content"
        ref={handleRef}
        contentEditable={view.editable.toString()}
      />
    </li>
  );
}
