import { domSerializationHelpers } from 'bangle-core/utils/dom-serialization-helpers';
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

function specFactory() {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 51,
    content: (node) => {
      let result = emojiLookup[node.attrs.emojiKind];
      return result || emojiLookup['question'];
    },
  });

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        emojiKind: {
          default: 'performing_arts',
        },
      },
      inline: true,
      group: 'inline',
      draggable: true,
      atom: true,
      toDOM,
      parseDOM,
    },

    markdown: {
      toMarkdown: (state, node) => {
        state.write(`:${node.attrs['emojiKind']}:`);
      },
      parseMarkdown: {
        emoji: {
          node: 'emoji',
          getAttrs: (tok) => {
            return {
              emojiKind: tok.markup,
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
        emojiKind: name,
      };

      dispatch(state.tr.replaceSelectionWith(emojiType.create(attr)));
    }
    return true;
  };
}
