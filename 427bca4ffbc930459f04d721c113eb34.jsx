import '@bangle.dev/core/style.css';
import '@bangle.dev/tooltip/style.css';
import '@bangle.dev/emoji/style.css';
import '@bangle.dev/react-emoji-suggest/style.css';
import React from 'react';
import { BangleEditor, useEditorState } from '@bangle.dev/react';
import { PluginKey } from '@bangle.dev/core';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';
import { emoji } from '@bangle.dev/emoji';
import { emojiSuggest, EmojiSuggest } from '@bangle.dev/react-emoji-suggest';

const emojiSuggestKey = new PluginKey('emojiSuggestKey');

const myEmojiDefs = {
  grinning: '😀',
  smiley: '😃',
  smile: '😄',
  grin: '😁',
  laughing: '😆',
  satisfied: '😆',
  sweat_smile: '😅',
  rofl: '🤣',
  joy: '😂',
  slightly_smiling_face: '🙂',
};

export default function Example() {
  const editorState = useEditorState({
    specs: [
      ...coreSpec(),
      emoji.spec({
        getEmoji: (emojiAlias) => myEmojiDefs[emojiAlias] || '❓',
      }),
      emojiSuggest.spec({ markName: 'emojiSuggest', trigger: ':' }),
    ],
    plugins: () => [
      ...corePlugins(),
      emoji.plugins(),
      emojiSuggest.plugins({
        key: emojiSuggestKey,
        emojis: Array.from(Object.entries(myEmojiDefs)),
        markName: 'emojiSuggest',
        tooltipRenderOpts: {
          placement: 'bottom',
        },
      }),
    ],
    initialValue: getInitialValue(),
  });

  return (
    <BangleEditor state={editorState}>
      <EmojiSuggest emojiSuggestKey={emojiSuggestKey} />
    </BangleEditor>
  );
}

function getInitialValue() {
  return JSON.parse(
    `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Please type "},{"type":"text","marks":[{"type":"code"}],"text":":"},{"type":"text","text":" to trigger the suggest menu."}]},{"type":"paragraph","content":[{"type":"text","text":"Or click after this colon -> "},{"type":"text","marks":[{"type":"emojiSuggest","attrs":{"trigger":":"}}],"text":":"}]}]}`,
  );
}
