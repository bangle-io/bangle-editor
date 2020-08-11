import React, { useEffect, useState, useRef } from 'react';
import {} from 'tiptap-commands';
import browser from '../utils/browser';
import { uuid } from '../utils/js-utils';
import cx from 'classnames';
import { Node } from './node';
import { objUid } from '../utils/object-uid';
import {
  enterKeyCommand,
  backspaceKeyCommand,
  indentList,
  outdentList,
} from './list-item/commands';
const LOG = false;

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
      createContentDOM: () => {
        const d = document.createElement('div');
        d.setAttribute('data-uuid', 'todo-content-dom-' + uuid(4));
        return { dom: d };
      },
      createDom: () => {
        const d = document.createElement('li');
        d.setAttribute('data-uuid', 'todo-dom-' + uuid(4));
        return d;
      },
      domRefClasses: () => `flex flex-row`,
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
      'Enter': enterKeyCommand(type),
      'Backspace': backspaceKeyCommand(type),
      'Tab': this.options.nested ? indentList(type) : () => {},
      'Shift-Tab': outdentList(type),
    };
  }

  render = (props) => {
    const mobile = browser.ios || browser.android;

    if (mobile) {
      return <MobileTodo {...props} />;
    }
    return <TodoItemComp {...props} />;
  };
}

function TodoItemComp(props) {
  const { node, view, handleRef, updateAttrs } = props;

  let uid = node.type.name + objUid.get(node);

  const { 'data-done': done } = node.attrs;
  return (
    <>
      <span
        className="todo-checkbox mr-2 self-start flex-none"
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
      <div
        className="todo-content flex-grow"
        ref={handleRef}
        data-done={done.toString()}
      />
    </>
  );
}

function MobileTodo(props) {
  const { node, view, handleRef, updateAttrs } = props;
  const { 'data-done': done } = node.attrs;

  return (
    <div contentEditable={true} className="flex flex-grow">
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
      <div
        className="todo-content inline-block flex flex-grow"
        ref={handleRef}
        data-done={done.toString()}
        contentEditable={true}
      />
    </div>
  );
}
