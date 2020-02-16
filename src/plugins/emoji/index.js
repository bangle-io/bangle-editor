import { MenuItem } from 'prosemirror-menu';

import { EMOJI_NODE_NAME, emojiAttrTypes, validEmojis } from './constants';
import { nodeHelpers } from 'Utils/bangle-utils';
import './emoji.css';
import { Node } from 'Utils/bangle-utils/helper-classes/node';
import { Emoji, Schema } from './Emoji';

function insertEmoji(schema, name) {
  let emojiType = schema.nodes[EMOJI_NODE_NAME];
  return function(state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, emojiType)) return false;
    if (dispatch) {
      const attr = {
        'data-type': name,
      };

      dispatch(
        state.tr.replaceSelectionWith(
          emojiType.create(nodeHelpers.createAttrObj(emojiAttrTypes, attr)),
        ),
      );
    }
    return true;
  };
}

export default class EmojiExtension extends Node {
  get name() {
    return EMOJI_NODE_NAME;
  }
  get schema() {
    return Schema;
  }
  get view() {
    return Emoji;
  }

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
