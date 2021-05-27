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

const emojiData = [
  {
    name: 'Smileys & Emotion',
    emojis: [
      ['hand_over_mouth', '🤭'],
      ['relieved', '😌'],
      ['pensive', '😔'],
      ['vomiting_face', '🤮'],
      ['disappointed_relieved', '😥'],
      ['persevere', '😣'],
    ],
  },
  {
    name: 'People & Body',
    emojis: [
      ['wave', '👋'],
      ['female_detective', '🕵️‍♀️'],
      ['person_with_veil', '👰'],
      ['man_with_veil', '👰‍♂️'],
      ['woman_with_veil', '👰‍♀️'],
      ['bride_with_veil', '👰‍♀️'],
      ['supervillain', '🦹'],
    ],
  },
  {
    name: 'Animals & Nature',
    emojis: [
      ['service_dog', '🐕‍🦺'],
      ['beaver', '🦫'],
      ['evergreen_tree', '🌲'],
      ['four_leaf_clover', '🍀'],
    ],
  },
];

const getEmojiByAlias = (emojiAlias) => {
  for (const { emojis } of emojiData) {
    const match = emojis.find((e) => e[0] === emojiAlias);
    if (match) {
      return match;
    }
  }
};

export default function Example() {
  const editorState = useEditorState({
    specs: [
      ...coreSpec(),
      emoji.spec({
        getEmoji: (emojiAlias) =>
          getEmojiByAlias(emojiAlias) || ['question', '❓'],
      }),
      emojiSuggest.spec({ markName: 'emojiSuggest' }),
    ],
    plugins: () => [
      ...corePlugins(),
      emoji.plugins(),
      emojiSuggest.plugins({
        key: emojiSuggestKey,
        getEmojiGroups: (queryText) => {
          if (!queryText) {
            return emojiData;
          }
          return emojiData
            .map((group) => {
              return {
                name: group.name,
                emojis: group.emojis.filter(([emojiAlias]) =>
                  emojiAlias.includes(queryText),
                ),
              };
            })
            .filter((group) => group.emojis.length > 0);
        },
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
    `{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Please type "},{"type":"text","marks":[{"type":"code"}],"text":":"},{"type":"text","text":" to trigger the emoji picker."}]},{"type":"paragraph","content":[{"type":"text","text":"Or click after this colon -> "},{"type":"text","marks":[{"type":"emojiSuggest","attrs":{"trigger":":"}}],"text":":"}]}]}`,
  );
}
