import * as emojiSuggest from './emoji-suggest';

export * from './EmojiSuggest';
export { emojiSuggest };

export type { GetEmojiGroupsType } from './emoji-suggest';
export { selectEmoji } from './emoji-suggest';
export { getSquareDimensions, resolveCounter, resolveRowJump } from './utils';
