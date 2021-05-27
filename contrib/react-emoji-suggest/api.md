---
title: '@bangle.dev/react-emoji-suggest'
sidebar_label: '@bangle.dev/react-emoji-suggest'
packageName: '@bangle.dev/react-emoji-suggest'
id: 'react_emoji_suggest'
---

`contrib`

This package provides you suggestions for picking your favourite emojis :sunglasses:!

### Installation

```
{{npmInstallation "@bangle.dev/react-emoji-suggest"}}
```

## Styling

Please use the stylesheet `style.css` like:

```js
import '@bangle.dev/react-emoji-suggest/style.css';
```

## emojiSuggest: {{core.link.Component}}

Shows a suggestion tooltip next to the trigger. Use `ArrowUp` , `ArrowDown` , `ArrowLeft` `ArrowRight` to select emoji. Use `Enter` or `MouseClick` to insert a selected emoji. Pressing `Escape` will dismiss the suggestion tooltip.

#### spec({ ... }): {{core.link.NodeSpec}}

Named parameters:

- **markName**: string\
  The mark name associated with this component. Please make sure this name is not already in use by existing nodes or marks.

- **trigger**: ?string=':'\
  The trigger key when typed that initiates the suggestions. Triggering also needs to have a space or new line precede the trigger string.

### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- **key:** ?{{Prosemirror.PluginKey}}

- **markName**: string\
  The `markName` you specified in above in the `spec`.

- **tooltipRenderOpts**: ?{{tooltip.link.tooltipRenderOpts}}

- **getEmojiGroups:** fn(queryText: string) -> Array<{groupName: string, emojis: EmojisArray}>\
  A callback which should return the filtered emojis corresponding to the query text. The `groupName` will be used in the UI to name the category of the emojis.

  - `EmojisArray`: Array<\[string, string\]>\
    An array where each item is a pair of `emojiAlias` and an emoji character, for example `[["office_worker", "🧑‍💼"], ["ninja", "🥷"]]`. The `emojiAlias` must be unique.

- **emojis**: Array<\[string, string\]> \
  An array of emoji description and the emoji character,

- **maxItems:** ?number=200\
  The maximum number of items that can be shown at a time.

### commands: {{core.link.CommandObject}}

- **queryTriggerText**(key: {{Prosemirror.PluginKey}}): {{core.link.Command}}\
  Query the trigger text that is being used to filter the `emojis`. For example, with `:` as trigger, if the user typed `:man` , `man` will the trigger text.

- **selectEmoji**(key: {{Prosemirror.PluginKey}}, emojiAlias: string): {{core.link.Command}}\
  Programmatically select an emoji. For example if `emojis=["office_worker", "🧑‍💼"], ["ninja", "🥷"]]`, executing command with `selectEmoji(key, 'ninja')(state, dispatch)` will create a `🥷` emoji.

**Usage**

Here is a sample usage of constructing the `getEmoji` callback that returns the filtered emojis corresponding to a query.

```js
const data = [
  { name: 'a-1', emojis: [['grinning', '😀']] },
  { name: 'a-2', emojis: [['smiley', '😃']] },
  { name: 'a-3', emojis: [['smile', '😄']] },
];

const getEmojiGroups = (queryText) => {
  return data
    .map((group) => {
      return {
        name: group.name,
        emojis: group.emojis.filter(
          ([alias]) => alias.includes(query) || query.includes(alias),
        ),
      };
    })
    .filter((r) => r.emojis.length > 0);
};
```

Additional links:

- [emoji component's API](https://bangle.dev/docs/api/emoji#emoji-data-source).

- {{example.ReactEmojiSuggestExample}}

## EmojiSuggest: {{global.link.ReactElement}}

**Props**

- **emojiSuggestKey**: ?{{Prosemirror.PluginKey}} \
  Pass the key that was used in `plugins()`.

**Usage**

Please see the {{example.ReactEmojiSuggestExample}}
