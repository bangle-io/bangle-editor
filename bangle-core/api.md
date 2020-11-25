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
  Query if the selection is inside a blockquote or not.

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
  Query if the selection is inside a bold mark or not.

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
  Allows automatic escaping of code mark at the edges. This particularly helps avoid the case when a user gets stuck inside a code mark and is not able to exit out of it when pressing arrow left or right.

### defaultKeys: {link.Keybindings}

- **toggleCode** = `` Mod-` ``: toggle code mark

### commands: {link.CommandsObject}

- **toggleCode**(): {link.Command}\
  Toggles code mark.

- **queryIsSelectionInCode**(): {link.QueryCommand.boolean}\
  Query if the selection is inside a code mark or not.

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

# codeBlock: {link.Component}

Enables `<code/>` in your editor.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **markdownShortcut**: ?Boolean = true\
  Toggle the markdown shortcut ` ``` ` to convert a paragraph into a codeBlock.

### defaultKeys: {link.Keybindings}

- **toCodeBlock**=`Shift-Ctrl-\`: wraps text in codeBlock.

- **moveDown**=`Alt-ArrowDown`: move codeBlock down

- **moveUp**=`Alt-ArrowUp`: move codeBlock up

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {text.insertEmptyParaAbove}

- **insertEmptyParaBelow**=`Mod-Enter`: {text.insertEmptyParaBelow}

### commands: {link.CommandsObject}

- **queryIsSelectionInCodeBlock**(): {link.QueryCommand.boolean}\
  Query if the selection is inside a codeBlock or not.

## **Usage**

```js
import { codeBlock } from '@banglejs/core';

const specFactory = [
  // other specs
  codeBlock.spec(),
];

const plugins = [
  // other plugins
  codeBlock.plugins(),
];
```

# doc: {link.Component}

Top level node needed by the editor to contain every other node. This is a required node and if a node spec with name `doc` is not provided, BangleJS will automatically use this spec.

### spec(): {link.NodeSpecFactory}

Returns a top level node spec, read more {text.Nodes}.

# heading: {link.Component}

Enables headings of various levels in your editor.

### spec({ ... }): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

Named parameters:

- **levels**: ?Array<Number> = `[1,2,3,4,5,6]` \
  The allowed levels for the heading, think `<h1/>`, `<h2/>` and so on. The array must be contiguous and the first element must be `1` and the last element must be less than or equal to `6`.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **markdownShortcut**: ?Boolean = `true`\
  Toggle the markdown shortcut `#<space>` to convert a paragraph into a heading element.

### defaultKeys: {link.Keybindings}

- **toH1**=`Shift-Ctrl-1`: Convert a node to heading of level 1. Is a no-op if the level `1` is disallowed.

- **toH2**=`Shift-Ctrl-2`: Convert a node to heading of level 2. Is a no-op if the level `2` is disallowed.

- **toH3**=`Shift-Ctrl-3`: Convert a node to heading of level 3. Is a no-op if the level `3` is disallowed.

- **toH4**=`Shift-Ctrl-4`: Convert a node to heading of level 4. Is a no-op if the level `4` is disallowed.

- **toH5**=`Shift-Ctrl-5`: Convert a node to heading of level 5. Is a no-op if the level `5` is disallowed.

- **toH6**=`Shift-Ctrl-6`: Convert a node to heading of level 6. Is a no-op if the level `6` is disallowed.

- **moveDown**=`Alt-ArrowDown`: move heading down

- **moveUp**=`Alt-ArrowUp`: move heading up

- **emptyCopy**=`Mod-c`: {text.emptyCopy}

- **emptyCut**=`Mod-x`: {text.emptyCut}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {text.insertEmptyParaAbove}

- **insertEmptyParaBelow**=`Mod-Enter`: {text.insertEmptyParaBelow}

### commands: {link.CommandsObject}

- **toggleItalic**(level: number = 3): {link.Command}\
  Toggles text into heading of given `level` and vice versa.

- **queryIsSelectionInHeading**(level: number = 3): {link.QueryCommand.boolean}\
  Query if the selection is inside a heading of given `level`.

## **Usage**

```js
import { heading } from '@banglejs/core';

const specFactory = [
  // other specs
  heading.spec({ levels: [1, 2] }),
];

const plugins = [
  // other plugins
  heading.plugins(),
];
```

# history: {link.Component}

Enables history in your editor, this is a wrapper for the prosemirror's [history module](https://prosemirror.net/docs/ref/#history). **Unless you are overriding this component, it will be included by default.**

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **historyOpts**: Object \
  see the Prosemirror history `config` [docs](https://prosemirror.net/docs/ref/#history.history^config) for the API.

### defaultKeys: {link.Keybindings}

- **undo**=`Mod-x`

- **redo**=`Mod-y Shift-Mod-z`

### commands: {link.CommandsObject}

- **undo**(): {link.Command}\
  Undoes the last step.

- **redo**(): {link.Command}\
  Redoes the last step.

# hardBreak: {link.Component}

Enables the `<br />` element in your editor.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **insert** = `Shift-Enter`: inserts a hard break

## **Usage**

```js
import { hardBreak } from '@banglejs/core';

const specFactory = [
  // other specs
  hardBreak.spec(),
];

const plugins = [
  // other plugins
  hardBreak.plugins(),
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

# image: {link.Component}

Enables images in your editor.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **handleDragAndDrop:** Boolean=`true` \
  Toggle the functionality of dragging-n-dropping and pasting of images into the editor.

## **Usage**

```js
import { image } from '@banglejs/core';

const specFactory = [
  // other specs
  image.spec(),
];

const plugins = [
  // other plugins
  image.plugins(),
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
  Query if the selection is inside an italic mark or not.

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
  Query if the selection is inside a strike mark or not.

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

# text: {link.Component}

The text node which the editor uses to wrap the text. This is a required node and if a node spec with name `text` is not provided, BangleJS will automatically use this spec.

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

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
  Query if the selection is inside an underline mark or not.

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
