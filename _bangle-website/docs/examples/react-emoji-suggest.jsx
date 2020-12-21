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
const emojisArray = [
  ['kiss', '💋'],
  ['standing_woman', '🧍‍♀️'],
  ['heartpulse', '💗'],
  ['japanese_ogre', '👹'],
  ['shallow_pan_of_food', '🥘'],
];
export default function Example() {
  const editorState = useEditorState({
    specs: [
      ...coreSpec(),
      emoji.spec(),
      emojiSuggest.spec({ markName: 'emojiSuggest', trigger: ':' }),
    ],
    plugins: () => [
      ...corePlugins(),
      emoji.plugins(),
      emojiSuggest.plugins({
        key: emojiSuggestKey,
        emojis: emojisArray,
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
    `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Everyone gets to pick an emoji "},{"type":"emoji","attrs":{"emojiKind":"heartpulse"}},{"type":"text","text":"!"}]},{"type":"paragraph","content":[{"type":"text","text":"Please type "},{"type":"text","marks":[{"type":"code"}],"text":":"},{"type":"text","text":" to trigger the suggest menu."}]},{"type":"paragraph","content":[{"type":"text","text":" "}]},{"type":"paragraph","content":[{"type":"text","text":"You can also click after this "},{"type":"text","marks":[{"type":"emojiSuggest","attrs":{"trigger":":"}}],"text":":"}]}]}`,
  );
}
