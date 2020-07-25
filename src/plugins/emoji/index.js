// import './emoji.css';

import React from 'react';

import { Node } from '../../../src/utils/bangle-utils/nodes/index';
import { EMOJI_NODE_NAME, validEmojis, emojiLookup } from './constants';

function insertEmoji(schema, name) {
  let emojiType = schema.nodes[EMOJI_NODE_NAME];
  return function (state, dispatch) {
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
  constructor(...args) {
    super(...args);
    this.chache = Math.random();
  }
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
        'style': {
          default: 'display: inline-block;',
        },
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

    console.log('rendering', this.chache);

    return (
      <EmojiComponent
        selected={selected}
        emojikind={emojikind}
        selectionStyle={this.options.selectionStyle}
      />
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

class EmojiComponent extends React.Component {
  papa = uuid();
  render() {
    const { emojikind, selectionStyle, selected } = this.props;
    if (emojikind === ':flag_lv:') {
      console.log(this.papa, emojikind);
    }

    return (
      <span contentEditable={false} style={selected ? selectionStyle : {}}>
        {emojiLookup[emojikind]}
      </span>
    );
  }
}

function uuid() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
