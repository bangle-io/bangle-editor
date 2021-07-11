import { domSerializationHelpers } from '@bangle.dev/core';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  insertEmoji,
};

const name = 'emoji';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ getEmoji, defaultEmojiAlias = 'smiley' }) {
  const { toDOM, parseDOM } = domSerializationHelpers(name, {
    tag: 'span',
    parsingPriority: 51,
    content: (node) => {
      let result = getEmoji(node.attrs.emojiAlias, node);
      return result;
    },
  });

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        emojiAlias: {
          default: defaultEmojiAlias,
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
        state.write(`:${node.attrs.emojiAlias}:`);
      },
      parseMarkdown: {
        emoji: {
          node: 'emoji',
          getAttrs: (tok) => {
            return {
              emojiAlias: tok.markup,
            };
          },
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = {} } = {}) {
  return () => {
    return [];
  };
}

export function insertEmoji(emojiAlias) {
  return function (state, dispatch) {
    let emojiType = getTypeFromSchema(state.schema);

    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, emojiType)) {
      return false;
    }
    if (dispatch) {
      const attr = {
        emojiAlias: emojiAlias,
      };

      dispatch(state.tr.replaceSelectionWith(emojiType.create(attr)));
    }
    return true;
  };
}
