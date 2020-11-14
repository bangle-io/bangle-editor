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

function specFactory({} = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        'data-emojikind': {
          default: 'performing_arts',
        },
        'data-bangle-name': {
          default: name,
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
      toDOM: (node) => {
        const { 'data-emojikind': emojikind } = node.attrs;
        let result = emojiLookup[emojikind];
        if (!result) {
          result = emojiLookup['question'];
        }

        return [
          'span',
          {
            'data-bangle-name': name,
            'data-emojikind': emojikind.toString(),
          },
          result,
        ];
      },
      parseDOM: [
        {
          tag: `span[data-bangle-name="${name}"]`,
          getAttrs: (dom) => {
            return {
              'data-bangle-name': name,
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
  };
}

function pluginsFactory({
  keybindings = { insertRandomEmoji: 'Shift-Ctrl-e' },
} = {}) {
  return () => {
    return [
      keymap({
        [keybindings.insertRandomEmoji]: insertRandomEmoji(),
      }),
    ];
  };
}

export function insertRandomEmoji() {
  return (state, dispatch) => {
    return insertEmoji(
      validEmojis[Math.floor(Math.random() * validEmojis.length)],
    )(state, dispatch);
  };
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
