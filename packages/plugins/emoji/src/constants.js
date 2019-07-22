import v from '@mapbox/fusspot';
import emojiList from 'emojis-list';
import emojisKeywords from 'emojis-keywords';

export const EMOJI_NODE_NAME = 'emoji';
export const EMOJI_WRAPPER_ELEMENT = 'span';

export const emojiLookup = {
  happy: '😏',
  sad: '😔',
  ...Object.fromEntries(
    Array.from({ length: 500 }, (v, i) => [emojisKeywords[i], emojiList[i]])
      .map(([name, emoji]) => [name, emoji])
      .slice(450)
  )
};

export const validEmojis = Object.keys(emojiLookup);

export const emojiAttrTypes = {
  'data-type': v.oneOf(validEmojis)
};
export const emojiAttrDefaults = {
  //   'data-type': 'brontosaurus'
};
