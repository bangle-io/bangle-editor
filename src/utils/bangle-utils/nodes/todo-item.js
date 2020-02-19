import React from 'react';
import ReactDOM from 'react-dom';
import {
  sinkListItem,
  splitToDefaultListItem,
  liftListItem,
} from 'tiptap-commands';
import { Plugin } from 'prosemirror-state';
import { getMarkRange } from 'tiptap-utils';

import { logObject } from '../utils/logging';
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

  get plugins() {
    return [
      new Plugin({
        props: {
          nodeViews: {
            todo_item: (node, view, getPos) => {
              console.log('constructing node view', node.type.name);

              return logObject(new TodoItemNodeView(node, view, getPos, this));
            },
          },
        },
      }),
    ];
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

class TodoItemNodeView {
  constructor(node, view, getPos, extension) {
    this.node = node;
    this.view = view;
    this.getPos = getPos;
    this.extension = extension;
    this.init();
  }

  init() {
    this.domRef = this.createDomRef();
    this.setDomAttrs(this.node, this.domRef); // copied from atlas's reactnodeview
    const contentDOMWrapper = this.getContentDOM();

    if (this.domRef && contentDOMWrapper) {
      this.domRef.appendChild(contentDOMWrapper);
      this.contentDOM = contentDOMWrapper;
      this.contentDOMWrapper = contentDOMWrapper;
    }

    // something gets messed up during mutation processing inside of a
    // nodeView if DOM structure has nested plain "div"s, it doesn't see the
    // difference between them and it kills the nodeView
    this.domRef.classList.add(`${this.node.type.name}NodeView-Wrap`); // Do we need this?
    this.renderComp();
  }

  // PM methods
  get dom() {
    return this.domRef;
  }

  // prevent a full re-render of the vue component on update
  // we'll handle prop updates in `update()`
  ignoreMutation(mutation) {
    // allow leaf nodes to be selected
    if (mutation.type === 'selection') {
      return false;
    }

    if (!this.contentDOM) {
      return true;
    }
    return !this.contentDOM.contains(mutation.target);
  }

  update(node) {
    // @see https://github.com/ProseMirror/prosemirror/issues/648
    const isValidUpdate = this.node.type === node.type; // && validUpdate(this.node, node);

    if (!isValidUpdate) {
      return false;
    }

    if (this.domRef && !this.node.sameMarkup(node)) {
      this.setDomAttrs(node, this.domRef); // TODO is this actually doing anything ? copied from atlask
    }

    this.node = node;
    this.renderComp();

    return true;
  }

  destroy() {
    if (!this.domRef) {
      return;
    }
    ReactDOM.unmountComponentAtNode(this.domRef);
    this.domRef = undefined;
    this.contentDOM = undefined;
  }

  // copied from atlasmk2
  setDomAttrs(node, element) {
    Object.keys(node.attrs || {}).forEach((attr) => {
      console.log('SETTING ATTRIBUTES', attr, node.attrs[attr]);
      element.setAttribute(attr, node.attrs[attr]);
    });
  }

  // from atlas expected that the person may implement
  createDomRef() {
    return this.node.isInline
      ? document.createElement('span')
      : document.createElement('div');
  }

  // from atlas expected that the person may implement it differentyl
  getContentDOM() {
    return document.createElement('div');
  }

  // gets called by the div grabbing this and using
  // it like render(props, forWardRef) => <div ref={forwardRef} />
  handleRef = (node) => {
    const contentDOM = this.contentDOM;
    // move the contentDOM node inside the inner reference after rendering
    if (node && contentDOM && !node.contains(contentDOM)) {
      node.appendChild(contentDOM);
    }
    this.contentDOM = node;
  };

  // from tiptap
  updateAttrs = (attrs) => {
    if (!this.view.editable) {
      return;
    }
    const { tr } = this.view.state;

    // NOTE: in tiptap they also handle marks
    const transaction = tr.setNodeMarkup(this.getPos(), undefined, {
      ...this.node.attrs,
      ...attrs,
    });
    this.view.dispatch(transaction);
  };

  renderComp() {
    ReactDOM.render(
      <ReactComp
        node={this.node}
        view={this.view}
        handleRef={this.handleRef}
        updateAttrs={this.updateAttrs}
      />,
      this.domRef,
    );
  }
}

let counter = 0;
function ReactComp(props) {
  const { node, view, handleRef, updateAttrs } = props;
  let uid = node.type.name + counter++;
  return (
    <li data-type={node.type.name} data-done={node.attrs.done.toString()}>
      <span className="todo_checkbox" contentEditable="false">
        <input
          type="checkbox"
          id={uid}
          name={uid}
          onClick={() => {
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
