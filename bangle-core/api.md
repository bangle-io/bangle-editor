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

- **queryIsBlockQuoteActive**(): {link.QueryCommand.boolean}\
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

- **queryIsBoldActive**(): {link.QueryCommand.boolean}\
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

# bulletList: {link.Component}

Enables bulletList `<ul/>`. **Requires node components with names `orderedList` & `listItem` to work**

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **markdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating a bullet list. Type `-`, `*` or `+` followed by a space to create a bullet list on an empty paragraph.

### defaultKeys: {link.Keybindings}

- **toggle**=`Shift-Ctrl-8`: Executes `toggleBulletList` command.

### commands: {link.CommandsObject}

- **toggleBulletList**(): {link.Command}\
   Convert to a bulletList and if already a bulletList, convert it to a paragraph node.

- **queryIsBulletListActive**(): {link.QueryCommand.boolean}\
  Query if the selection is inside a bullet list.

## **Usage**

```js
import { bulletList, listItem } from '@banglejs/core';

const specFactory = [
  // other specs
  listItem.spec(),
  bulletList.spec(),
  orderedList.spec(),
];

const plugins = [
  // other plugins
  listItem.plugins(),
  bulletList.plugins(),
  orderedList.plugins(),
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

- **queryIsCodeActive**(): {link.QueryCommand.boolean}\
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

- **queryIsCodeActiveBlock**(): {link.QueryCommand.boolean}\
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

Top level node needed by the editor to contain every other node. The spec & plugins for this component are **required** for Bangle to function, if a spec named `doc` is not found in not defined, Bangle will default to this one.

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

- **queryIsHeadingActive**(level: number = 3): {link.QueryCommand.boolean}\
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

- **queryIsItalicActive**(): {link.QueryCommand.boolean}\
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

# link: {link.Component}

Allows text in your editor to be marked as link.

### spec({ ... }): {link.MarkSpecFactory}

Returns a mark spec, read more {text.Marks}.

Named parameters:

- **openOnClick**: Boolean=`false`\
  If enabled clicking a link will open the link in new tab. If disabled, clicking a link will set the cursor on it.

### plugins(): {link.PluginsFactory}

### commands: {link.CommandsObject}

- **createLink**(href : string): {link.Command}\
  Creates a link mark on the selection text.

- **updateLink**(href : ?string): {link.Command}\
  Updates a link mark on the selection text with `href`. Set `href` to `undefined` to clear the link mark. If selection is empty, it will update the parent text node.

- **queryLinkAttrs**(): {link.QueryCommand.customStart}?{href: string, text: string}{link.QueryCommand.customEnd} \
  Returns the details of the link mark in selection.

- **queryIsLinkAllowedInRange**(from: number, to: number): {link.QueryCommand.boolean}\
  Queries if the range allows for creation of link mark.

- **queryIsLinkActive**(): {link.QueryCommand.boolean}\
  Queries if the selection is in a link mark.

- **queryIsSelectionAroundLink**(): {link.QueryCommand.boolean}\
  Queries if the selection is around a link mark.

## **Usage**

```js
import { link } from '@banglejs/core';

const specFactory = [
  // other specs
  link.spec(),
];

const plugins = [
  // other plugins
  link.plugins(),
];
```

# listItem: {link.Component}

Creates a listItem `<li/>`. **Requires node components with names `bulletList` and `orderedList` to work**

### spec({ ... }): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **indent**=`Tab`: Indents the listItem

- **outdent**=`Shift-Tab`: Outdents the listItem

- **moveDown**=`Alt-ArrowDown`: move listItem down

- **moveUp**=`Alt-ArrowUp`: move listItem up

- **emptyCopy**=`Mod-c`: {text.emptyCopy}

- **emptyCut**=`Mod-x`: {text.emptyCut}

- **insertEmptyListAbove**=`Mod-Shift-Enter`: Insert a new list above the current list and move cursor to it.

- **insertEmptyListBelow**=`Mod-Enter`: Insert a new list below the current list and move cursor to it.

### commands: {link.CommandsObject}

## **Usage**

```js
import { orderedList, bulletList, listItem } from '@banglejs/core';

const specFactory = [
  // other specs
  listItem.spec(),
  orderedList.spec(),
  bulletList.spec(),
];

const plugins = [
  // other plugins
  listItem.plugins(),
  orderedList.plugins(),
  bulletList.spec(),
];
```

# orderedList: {link.Component}

Enables orderedList `<ol/>`. **Requires node components with names `bulletList`, `listItem` to work**

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **markdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating an ordered list. Type `1.` followed by a space to create an ordered list on an empty paragraph.

### defaultKeys: {link.Keybindings}

- **toggle**=`Shift-Ctrl-9`: Executes `toggleOrderedList` command.

### commands: {link.CommandsObject}

- **toggleOrderedList**(): {link.Command}\
   Convert to an orderedList and if already an orderedList, convert it to a paragraph node.

- **queryIsSelectionInsideOrderedList**(): {link.QueryCommand.boolean}\
  Query if the selection is inside an ordered list.

## **Usage**

```js
import { orderedList, bulletList, listItem } from '@banglejs/core';

const specFactory = [
  // other specs
  listItem.spec(),
  orderedList.spec(),
  bulletList.spec(),
];

const plugins = [
  // other plugins
  listItem.plugins(),
  orderedList.plugins(),
  bulletList.spec(),
];
```

# paragraph: {link.Component}

Enables paragraph (`<p/>` in html) nodes in your editor. The spec & plugins for this component are **required** for Bangle to function, if a spec named `paragraph` is not found in not defined, Bangle will default to this one.

### spec(): {link.NodeSpecFactory}

Returns a spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

### defaultKeys: {link.Keybindings}

- **jumpToStartOfParagraph**=`Ctrl-a (mac) Ctrl-Home (linux/pc)`: Executes the `jumpToStartOfParagraph` command (see commands below).

- **jumpToEndOfParagraph**=`Ctrl-a (mac) Ctrl-Home (linux/pc)`: Executes the `jumpToEndOfParagraph` command (see commands below).

- **moveDown**=`Alt-ArrowDown`: move paragraph down

- **moveUp**=`Alt-ArrowUp`: move paragraph up

- **emptyCopy**=`Mod-c`: {text.emptyCopy}

- **emptyCut**=`Mod-x`: {text.emptyCut}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {text.insertEmptyParaAbove}

- **insertEmptyParaBelow**=`Mod-Enter`: {text.insertEmptyParaBelow}

- **toggleParagraph**=`Ctrl-Shift-0`: Toggles a node to paragraph and vice versa.

### commands: {link.CommandsObject}

- **jumpToStartOfParagraph**(): {link.Command}\
  Jumps the cursor to the start of paragraph.

- **jumpToEndOfParagraph**(): {link.Command}\
  Jumps the cursor to the end of paragraph.

- **convertToParagraph**(): {link.Command}\
  Coverts the node in selection to paragraph type.

- **queryIsParagraph**(): {link.QueryCommand.boolean}\
  Query if it is paragraph under the selection.

- **queryIsTopLevelParagraph**(): {link.QueryCommand.boolean}\
  Query if it is paragraph under the selection and it is a direct descendant of the top level `doc` node.

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

- **queryIsStrikeActive**(): {link.QueryCommand.boolean}\
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

The text node which the editor uses to wrap the text. The spec & plugins for this component are **required** for Bangle to function, if a spec named `text` is not found in not defined, Bangle will default to this one.

### spec(): {link.NodeSpecFactory}

Creates a todoItem node spec with `done` attribute, read more {text.Nodes}.

# todoItem: {link.Component}

Creates a todoItem with a `done` attribute. **Requires node components with names `todoList`, `bulletList`,`orderedList` & `listItem` to work**

### spec({ ... }): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

Named parameters:

- **nested**: boolean=`true`\
  Allows nesting of todo items.
- **draggable**: boolean=`true`\
  Make todo items draggable.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **nodeView**: boolean=`true`\
  If `true`, will use the default todoItem nodeView. Set it to `false` to disable the default todoItem nodeView. The typical use-case for setting it to `false` is when you want to use a custom nodeView for todoItem. See the {link.nodeViews} section for more details.

### defaultKeys: {link.Keybindings}

- **toggleDone**=`Ctrl-Enter (mac) Ctrl-I (linux/windows)`: Toggles the todo item's done status.

- **indent**=`Tab`: Indents the todo item

- **outdent**=`Shift-Tab`: Outdents the todo item

- **moveDown**=`Alt-ArrowDown`: move todoItem down

- **moveUp**=`Alt-ArrowUp`: move todoItem up

- **emptyCopy**=`Mod-c`: {text.emptyCopy}

- **emptyCut**=`Mod-x`: {text.emptyCut}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {text.insertEmptyParaAbove}

- **insertEmptyParaBelow**=`Mod-Enter`: {text.insertEmptyParaBelow}

### commands: {link.CommandsObject}

- **toggleTodoItemDone**(): {link.Command}\
   Toggle the done attribute of the todo item in the selection.

- **queryTodoItemAttrs**(): {link.QueryCommand.customStart}?{done: boolean}{link.QueryCommand.customEnd}\
  Query the todo item attributes.

## **Usage**

```js
import {
  todoList,
  todoItem,
  orderedList,
  bulletList,
  listItem,
} from '@banglejs/core';

const specFactory = [
  // other specs
  listItem.spec(),
  todoItem.spec(),
  orderedList.spec(),
  bulletList.spec(),
  todoList.spec(),
];

const plugins = [
  // other plugins
  listItem.plugins(),
  todoItem.plugins(),
  orderedList.plugins(),
  bulletList.spec(),
  todoList.plugins(),
];
```

# todoList: {link.Component}

A wrapper node component for `todoItem`, similar to how `orderedList` is a wrapper for `listItem`. **Requires node components with names `todoItem`, `bulletList`,`orderedList` & `listItem` to work**

### spec(): {link.NodeSpecFactory}

Returns a node spec, read more {text.Nodes}.

### plugins({ ... }): {link.PluginsFactory}

Named parameters:

- {text.pluginsParamKeybindings}

- **markdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating a todo list. Type `[ ]` or `[]` followed by a space to create an unchecked todoList on an empty paragraph.

### defaultKeys: {link.Keybindings}

- **toggle**=`Shift-Ctrl-7`: Executes `toggleTodoList` command.

### commands: {link.CommandsObject}

- **toggleTodoList**(): {link.Command}\
   Convert to an todoList and if already an todoList, convert it to a paragraph node.

- **queryIsTodoListActive**(): {link.QueryCommand.boolean}\
  Query if the selection is inside a todo list.

## **Usage**

See `todoItem` usage.

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

- **queryIsUnderlineActive**(): {link.QueryCommand.boolean}\
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
