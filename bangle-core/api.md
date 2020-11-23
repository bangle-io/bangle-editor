# blockquote: {link.Component}

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

### commands: {link.CommandsObject}

- **queryIsSelectionInBlockQuote**(): {link.QueryCommand.boolean}\
  Check if the selection is inside a blockquote or not.

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

# bold: {link.Component}

Allows text in your editor to marked as bold.

### spec(): {link.SpecFactory}

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- toggleBold: `Mod-b` toggle bold mark

### commands: {link.CommandsObject}

- **toggleBold**(): {link.Command}\
  Toggles bold mark.

- **queryIsSelectionInBold**(): {link.QueryCommand.boolean}\
  Check if the selection is inside a bold mark or not.

## **Usage**

```js
import { bold } from '@banglejs/core';

const specFactory = [
  // other specs
  bold.spec(),
];

const plugins = [
  // other plugins
  bold.plugins(),
];
```
