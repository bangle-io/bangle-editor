import './emoji.css';

import React from 'react';

import { EMOJI_NODE_NAME, validEmojis } from './constants';
import { Node } from 'Utils/bangle-utils/nodes';
import { emojiLookup } from './constants';

function insertEmoji(schema, name) {
  let emojiType = schema.nodes[EMOJI_NODE_NAME];
  return function(state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, emojiType)) return false;
    if (dispatch) {
      const attr = {
        'data-emojikind': name,
      };

      dispatch(state.tr.replaceSelectionWith(emojiType.create(attr)));
    }
    return true;
  };
}

export default class EmojiExtension extends Node {
  get defaultOptions() {
    return {
      selectionStyle: { outline: '2px solid blue' },
    };
  }

  get name() {
    return EMOJI_NODE_NAME;
  }

  get schema() {
    return {
      attrs: {
        'data-emojikind': {
          default: ':couple::tone4:',
        },
        'data-type': {
          default: this.name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
      // NOTE: Seems like this is used as an output to outside world
      //      when you like copy or drag
      toDOM: (node) => {
        const { 'data-emojikind': emojikind } = node.attrs;
        return [
          'span',
          {
            'data-type': this.name,
            'data-emojikind': emojikind.toString(),
          },
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: `span[data-type="${this.name}"]`,
          getAttrs: (dom) => {
            return {
              'data-type': this.name,
              'data-emojikind': dom.getAttribute('data-emojikind'),
            };
          },
        },
      ],
    };
  }

  render = ({ node, selected }) => {
    const { 'data-emojikind': emojikind } = node.attrs;

    return (
      <span
        contentEditable={false}
        style={selected ? this.options.selectionStyle : {}}
      >
        {emojiLookup[emojikind]}
      </span>
    );
  };

  commands({ type, schema }) {
    return {
      randomEmoji: () => {
        return insertEmoji(
          schema,
          validEmojis[Math.floor(Math.random() * validEmojis.length)],
        );
      },
    };
  }

  keys({ schema, type }) {
    return {
      'Shift-Ctrl-e': insertEmoji(schema, 'sad'),
    };
  }
}
