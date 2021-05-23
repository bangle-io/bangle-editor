---
title: '@bangle.dev/emoji'
sidebar_label: '@bangle.dev/emoji'
packageName: '@bangle.dev/emoji'
id: 'emoji'
---

### Installation

```
{{npmInstallation "@bangle.dev/emoji"}}
```

## emoji: {{core.link.Component}}

Allows you to show emojis 😎 in your editor. {{global.link.MarkdownSupport}}

#### spec({ ... }): {{core.link.NodeSpec}}

Named parameters:

- **getEmoji:** fn(emojiAlias: string ) -> string\
  A callback that gets called with `emojiAlias` (a plain text representation of the emoji like `smiley`, `green_book`) and should return the emoji character associated with the alias.

- **defaultEmojiAlias**: ?string='smiley'\
  If alias to use when not provided.

#### commands: {{core.link.CommandObject}}

- **insertEmoji**(emojiAlias: string): {{core.link.Command}}\
  A command that inserts an emoji.

### Markdown support

This component supports markdown by serializing emoji nodes into `:<emojiAlias>:`For example, `😈` will be serialized into `:smiling_imp:`.

This package uses the npm package [markdown-it-emoji](https://github.com/markdown-it/markdown-it-emoji) to provide this support. It also exports the `lite` version of the plugin which allows for passing your own emoji dataset.

Sample code for setting up markdown.

```js
import {
  markdownParser,
  markdownSerializer,
  defaultMarkdownItTokenizer,
} from '@bangle.dev/markdown';
import { emoji, emojiMarkdownItPlugin } from '@bangle.dev/emoji';

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

const specRegistry = [
  // your other specs,
  emoji.spec({
    getEmoji: (emojiAlias) => myEmojiDefs[emojiAlias] || '❓',
  }),
];

const parser = markdownParser(
  specRegistry,
  defaultMarkdownItTokenizer.use(emojiMarkdownItPlugin, {
    // https://github.com/markdown-it/markdown-it-emoji options go here
    defs: myEmojiDefs,
  }),
);

const serializer = markdownSerializer(specRegistry);
```

### Emoji Data source

This package does not provide emoji data, you will have to load it yourself. If you want you can use [emoji-lookup-data](https://github.com/bangle-io/emoji-lookup-data) datasource which is an optimized fork of [gemoji](https://github.com/github/gemoji). Or, you can use [markdown-it-emoji's data](https://github.com/markdown-it/markdown-it-emoji/tree/master/lib/data) for an even smaller subset of data.

📖 See [Bangle Markdown example](https://bangle.dev/docs/examples/markdown-editor)

📖 See [Markdown component API](https://bangle.dev/docs/api/markdown)
