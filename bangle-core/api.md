# blockquote: Component

Enables blockquote in your editor.

### spec(): {link.SpecFactory}

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- wrapIn: `Ctrl-ArrowRight` wrap text in blockquote.

- moveDown: `Alt-ArrowDown` move blockquote down

- moveUp: `Alt-ArrowUp` move blockquote up

- emptyCopy: `Mod-c` {text.emptyCopy}

- emptyCut: `Mod-x` {text.emptyCut}

- insertEmptyParaAbove: `Mod-Shift-Enter` {text.insertEmptyParaAbove}

- insertEmptyParaBelow: `Mod-Enter` {text.insertEmptyParaBelow}

## **Usage**

```js
import { blockquote } from '@banglejs/core';

const specFactory = [
  // other specs
  blockquote.spec(),
];

const plugins = [
  // other plugins
  blockquote.plugins(),
];
```
