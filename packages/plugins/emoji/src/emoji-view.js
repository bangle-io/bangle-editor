import React from 'react';
import ReactDOM from 'react-dom';

import { nodeHelpers } from 'bangle-utils';

import {
  EMOJI_NODE_NAME,
  emojiAttrTypes,
  EMOJI_WRAPPER_ELEMENT
} from './constants';
import { Emoji } from './Emoji';

export function getNodeView() {
  return {
    [EMOJI_NODE_NAME](node) {
      return new EmojiView(node);
    }
  };
}

class EmojiView {
  constructor(node, ...args) {
    this.dom = document.createElement(EMOJI_WRAPPER_ELEMENT);
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
      React.createElement(Emoji, {
        attrs: nodeHelpers.getAttrsFromNode(emojiAttrTypes, this.node),
        selected
      }),
      this.dom
    );
  }
}
