import { MenuItem } from 'prosemirror-menu';

import { EMOJI_NODE_NAME, emojiAttrTypes, validEmojis } from './constants';
import { nodeHelpers } from 'bangle-utils';
import './emoji.css';

export { insertSchema } from './emoji-schema';
export { getNodeView } from './emoji-view';

export function insertMenuItem(schema) {
  return menu => {
    validEmojis.forEach(name =>
      menu.insertMenu.content.push(
        new MenuItem({
          title: 'Insert ' + name,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          enable(state) {
            return insertEmoji(schema, name)(state);
          },
          run: insertEmoji(schema, name)
        })
      )
    );
    return menu;
  };
}

function insertEmoji(schema, type) {
  let emojiType = schema.nodes[EMOJI_NODE_NAME];
  return function(state, dispatch) {
    let { $from } = state.selection,
      index = $from.index();
    if (!$from.parent.canReplaceWith(index, index, emojiType)) return false;
    if (dispatch) {
      const attr = {
        'data-type': type
      };

      dispatch(
        state.tr.replaceSelectionWith(
          emojiType.create(nodeHelpers.createAttrObj(emojiAttrTypes, attr))
        )
      );
    }
    return true;
  };
}
