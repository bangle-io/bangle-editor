---
title: '@banglejs/react-emoji-suggest'
sidebar_label: '@banglejs/react-emoji-suggest'
packageName: '@banglejs/react-emoji-suggest'
id: 'emoji_suggest'
---

`contrib`

This package provides you suggestions for picking your favourite emojis :sunglasses:!

### Installation

```
npm install @banglejs/react-emoji-suggest @banglejs/emoji
```

## emojiSuggest: {{core.link.Component}}

#### spec({ ... }): {{core.link.NodeSpec}}

Named parameters:

- **markName**: string\
  The mark name associated with this component. If you using multiple suggestion components, please make sure this value is unique.
- **trigger**: ?string=':'\
  The trigger key when typed that initiates the suggestions.

### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- **key:** ?{{core.link.PluginKey}}
- **markName**: string\
  The `markName` you specified in above in the `spec`.
- **tooltipRenderOpts**: ?{{tooltip.link.tooltipRenderOpts}}\
  Hola
- **emojis**: Array<[string, string]> \
  An array of emoji description and the emoji character, for example `[["office_worker", "🧑‍💼"], ["ninja", "🥷"]]`.

**Usage**

Please see the {{example.ReactEmojiSuggestExample}}
