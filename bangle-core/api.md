# blockquote: {link.Component}

Enables blockquote in your editor.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **wrapIn**=`Ctrl-ArrowRight`: wrap text in blockquote.

- **moveDown**=`Alt-ArrowDown`: move blockquote down

- **moveUp**=`Alt-ArrowUp`: move blockquote up

- **emptyCopy**=`Mod-c`: {text.emptyCopy}

- **emptyCut**=`Mod-x`: {text.emptyCut}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {text.insertEmptyParaAbove}

- **insertEmptyParaBelow**=`Mod-Enter`: {text.insertEmptyParaBelow}

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

Allows text in your editor to be marked as bold.

### spec(): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **toggleBold** = `Mod-b`: toggle bold mark

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

# italic: {link.Component}

Allows text in your editor to be marked as italic.

### spec(): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **toggleItalic** = `Mod-i`: toggle an italic mark

### commands: {link.CommandsObject}

- **toggleItalic**(): {link.Command}\
  Toggles italic mark.

- **queryIsSelectionInItalic**(): {link.QueryCommand.boolean}\
  Check if the selection is inside an italic mark or not.

## **Usage**

```js
import { italic } from '@banglejs/core';

const specFactory = [
  // other specs
  italic.spec(),
];

const plugins = [
  // other plugins
  italic.plugins(),
];
```

# strike: {link.Component}

Allows text in your editor to be marked as strike.

### spec(): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **toggleStrike** = `Mod-d`: toggle a strike mark

### commands: {link.CommandsObject}

- **toggleStrike**(): {link.Command}\
  Toggles strike mark.

- **queryIsSelectionInStrike**(): {link.QueryCommand.boolean}\
  Check if the selection is inside a strike mark or not.

## **Usage**

```js
import { strike } from '@banglejs/core';

const specFactory = [
  // other specs
  strike.spec(),
];

const plugins = [
  // other plugins
  strike.plugins(),
];
```
