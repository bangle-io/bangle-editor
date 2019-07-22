import React from 'react';
import ReactDOM from 'react-dom';

import { nodeHelpers } from 'bangle-utils';

import {
  DINO_NODE_NAME,
  dinoAttrTypes,
  DINO_WRAPPER_ELEMENT
} from './constants';
import { Dino } from './Dino';

export function getNodeView() {
  return {
    [DINO_NODE_NAME](node) {
      return new DinoView(node);
    }
  };
}

class DinoView {
  constructor(node, ...args) {
    this.dom = document.createElement(DINO_WRAPPER_ELEMENT);
    this.node = node;
    this._render();
  }

  selectNode() {
    this._render({ selected: true });
  }

  deselectNode() {
    this._render();
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this.dom);
  }

  stopEvent(e) {
    return false;
  }

  _render({ selected = false } = {}) {
    ReactDOM.render(
      React.createElement(Dino, {
        attrs: nodeHelpers.getAttrsFromNode(dinoAttrTypes, this.node),
        selected
      }),
      this.dom
    );
  }
}
