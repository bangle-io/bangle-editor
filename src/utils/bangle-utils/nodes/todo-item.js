import React from 'react';
import {
  sinkListItem,
  splitToDefaultListItem,
  liftListItem,
} from 'tiptap-commands';

import { Node } from './node';
import { ReactNodeView } from '../helper-react/react-node-view';

export class TodoItem extends Node {
  get name() {
    return 'todo_item';
  }

  nodeView() {}

  get defaultOptions() {
    return {
      nested: false,
    };
  }

  view(pp, forwardRef) {
    return class TodoItem extends React.Component {
      handleClick = () => {};
      render() {
        const { node, view } = this.props;
        return (
          <li data-type={node.type.name} data-done={node.attrs.done.toString()}>
            <span
              className="todo-checkbox"
              contentEditable="false"
              onClick={this.handleClick}
            ></span>
            <div
              className="todo-content"
              ref={forwardRef}
              contentEditable={view.editable.toString()}
            ></div>
          </li>
        );
      }
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
}
