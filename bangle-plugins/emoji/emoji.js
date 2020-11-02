import React from 'react';
import { keymap } from 'prosemirror-keymap';
import { EMOJI_NODE_NAME, validEmojis, emojiLookup } from './constants';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  insertRandomEmoji,
  insertEmoji,
};

const name = EMOJI_NODE_NAME;
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ selectionStyle = { outline: '2px solid blue' } } = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        'style': {
          // TODO using this to attrs style is a bad idea as this
          //   // is saved in the HDD and any future ui change will over overriden by the saved style in attribute
          default: 'display: inline-block;',
        },
        'data-emojikind': {
          default: 'performing_arts',
        },
        'data-type': {
          default: name,
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
            'data-type': name,
            'data-emojikind': emojikind.toString(),
          },
        ];
      },
      // NOTE: this is the opposite part where you parse the output of toDOM
      //      When getAttrs returns false, the rule won't match
      //      Also, it only takes attributes defined in spec.attrs
      parseDOM: [
        {
          tag: `span[data-type="${name}"]`,
          getAttrs: (dom) => {
            return {
              'data-type': name,
              'data-emojikind': dom.getAttribute('data-emojikind'),
            };
          },
        },
      ],
    },

    markdown: {
      toMarkdown: (state, node) => {
        state.write(`:${node.attrs['data-emojikind']}:`);
      },
      parseMarkdown: {
        emoji: {
          node: 'emoji',
          getAttrs: (tok) => {
            return {
              'data-emojikind': tok.markup,
            };
          },
        },
      },
    },

    nodeView: {
      render: ({ node, selected }) => {
        const { 'data-emojikind': emojikind } = node.attrs;

        return (
          <EmojiComponent
            selected={selected}
            emojikind={emojikind}
            selectionStyle={selectionStyle}
          />
        );
      },
    },
  };
}

function pluginsFactory({ keys = { insertRandomEmoji: 'Shift-Ctrl-e' } } = {}) {
  return () => {
    return [
      keymap({
        [keys.insertRandomEmoji]: insertRandomEmoji(),
      }),
    ];
  };
}

class EmojiComponent extends React.Component {
  render() {
    const { emojikind, selectionStyle, selected } = this.props;
    return (
      <span contentEditable={false} style={selected ? selectionStyle : {}}>
        {emojiLookup[emojikind]}
      </span>
    );
  }
}

export function insertRandomEmoji() {
  return (state, dispatch) =>
    insertEmoji(validEmojis[Math.floor(Math.random() * validEmojis.length)])(
      state,
      dispatch,
    );
}

export function insertEmoji(
  name = validEmojis[Math.floor(Math.random() * validEmojis.length)],
) {
  return function (state, dispatch) {
    let emojiType = getTypeFromSchema(state.schema);

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
