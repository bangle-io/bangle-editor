---
title: '@banglejs/react-emoji-suggest'
sidebar_label: '@banglejs/react-emoji-suggest'
packageName: '@banglejs/react-emoji-suggest'
id: 'react_emoji_suggest'
---

`contrib`

This package provides you suggestions for picking your favourite emojis :sunglasses:!

### Installation

```
{{npmInstallation "@banglejs/react-emoji-suggest"}}
```

## emojiSuggest: {{core.link.Component}}

Shows a suggestion tooltip next to the trigger. Use `ArrowUp` and `ArrowDown` to change selection. Use `Enter` or `MouseClick` to insert a selected emoji. Pressing `Escape` will dismiss the suggestion tooltip.

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

- **emojis**: Array<\[string, string\]> \
  An array of emoji description and the emoji character, for example `[["office_worker", "🧑‍💼"], ["ninja", "🥷"]]`.

- **maxItems:** ?number=200\
  The maximum number of items that can be shown at a time.

- **tooltipRenderOpts**: {{tooltip.link.tooltipRenderOpts}}

### commands: {{core.link.CommandObject}}

- **queryTriggerText**(key: {{Prosemirror.PluginKey}}): {{core.link.Command}}\
  Query the trigger text that is being used to filter the `emojis`. For example, with `:` as trigger, if the user typed `:man` , `man` will the trigger text.

- **selectEmoji**(key: {{Prosemirror.PluginKey}}, emojiKind: string): {{core.link.Command}}\
  Programmatically select an emoji. For example if `emojis=["office_worker", "🧑‍💼"], ["ninja", "🥷"]]`, executing command with `selectEmoji(key, 'ninja')(state, dispatch)` will create a `🥷` emoji.

**Usage**

Please see the {{example.ReactEmojiSuggestExample}}

## EmojiSuggest: {{global.link.ReactElement}}

**Props**

- **emojiSuggestKey**: ?{{Prosemirror.PluginKey}} \
  Pass the key that was used in `plugins()`.

**Usage**

Please see the {{example.ReactEmojiSuggestExample}}