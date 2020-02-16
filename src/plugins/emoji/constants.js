import v from '@mapbox/fusspot';
import emojiList from 'emojis-list';
import emojisKeywords from 'emojis-keywords';

export const EMOJI_NODE_NAME = 'emoji';

export const emojiLookup = Object.fromEntries(
  Array.from({ length: emojiList.length }, (v, i) => [
    emojisKeywords[i],
    emojiList[i],
  ]).map(([name, emoji]) => [name, emoji]),
);

export const validEmojis = Object.keys(emojiLookup);

export const emojiAttrTypes = {
  'data-type': v.oneOf(validEmojis),
};
export const emojiAttrDefaults = {};
