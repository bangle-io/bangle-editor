// import './emoji.css';

import React from 'react';

import { Node } from 'bangle-core/nodes';
import { EMOJI_NODE_NAME, validEmojis, emojiLookup } from './constants';
import { serializeAtomNodeToMdLink } from 'bangle-plugins/markdown/markdown-serializer';

const LOG = false;

function log(...args) {
  if (LOG) {
    console.log('emoji/index.js:', ...args);
  }
}

function insertEmoji(schema, name) {
  let emojiType = schema.nodes[EMOJI_NODE_NAME];
  return function (state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, emojiType)) {
      return false;
    }
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
        'style': {
          // TODO using this to attrs style is a bad idea as this
          //   // is saved in the HDD and any future ui change will over overriden by the saved style in attribute
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

  toMarkdown(state, node) {
    const string = serializeAtomNodeToMdLink(this.name, node.attrs);
    state.write(string);
  }

  render = ({ node, selected }) => {
    const { 'data-emojikind': emojikind } = node.attrs;

    log('rendering', emojikind);

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
  componentWillUnmount() {
    log('unmounting EmojiComponent');
  }
  render() {
    const { emojikind, selectionStyle, selected } = this.props;

    return (
      <span contentEditable={false} style={selected ? selectionStyle : {}}>
        {emojiLookup[emojikind]}
      </span>
    );
  }
}
