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

Allows text in your editor to be marked as bold. Comes with the markdown shortcut `**text**` to enable bold mark.

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

# code: {link.Component}

Allows text in your editor to be marked as code. Comes with the markdown shortcut `` `text` `` to enable code mark.

### spec(): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **escapeAtEdge:** ?Boolean = true\
  Allows graceful escaping of code mark at the edges. This particularly helps avoid the case when a user gets stuck inside a code mark and is not able to exit out of it when pressing arrow left or right.

### defaultKeys: {link.Keybindings}

- **toggleCode** = `Mod-b`: toggle code mark

### commands: {link.CommandsObject}

- **toggleCode**(): {link.Command}\
  Toggles code mark.

- **queryIsSelectionInCode**(): {link.QueryCommand.boolean}\
  Check if the selection is inside a code mark or not.

## **Usage**

```js
import { code } from '@banglejs/core';

const specFactory = [
  // other specs
  code.spec(),
];

const plugins = [
  // other plugins
  code.plugins(),
];
```

# horizontalRule: {link.Component}

Enables a horizontal (`<hr />`) rule component in your editor. Type `---` and `___` {link.InputRules} to insert a horizontal rule followed by an empty paragraph.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

## **Usage**

```js
import { horizontalRule } from '@banglejs/core';

const specFactory = [
  // other specs
  horizontalRule.spec(),
];

const plugins = [
  // other plugins
  horizontalRule.plugins(),
];
```

# italic: {link.Component}

Allows text in your editor to be marked as italic. Comes with the markdown shortcut `_text_` to enable italic mark.

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

# underline: {link.Component}

Allows text in your editor to be marked as underline.

### spec(): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **toggleUnderline** = `Mod-u`: toggle an underline mark

### commands: {link.CommandsObject}

- **toggleUnderline**(): {link.Command}\
  Toggles underline mark.

- **queryIsSelectionInUnderline**(): {link.QueryCommand.boolean}\
  Check if the selection is inside an underline mark or not.

## **Usage**

```js
import { underline } from '@banglejs/core';

const specFactory = [
  // other specs
  underline.spec(),
];

const plugins = [
  // other plugins
  underline.plugins(),
];
```