---
title: '@banglejs/core'
sidebar_label: '@banglejs/core'
packageName: '@banglejs/core'
id: 'core'
---

`@banglejs/core` as the name suggests is the core of BangleJS and most packages expect it as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/). To install run:

```
npm install @banglejs/core
```

{{global.useRightSidebar}}

## Component

The building block of BangleJS is a component. At it's heart, we have a vanilla Javascript module which exports the follow properties:

- **?spec(opts: Object):** [Spec](#spec)\
  The specification which defines how the component will be rendered in the Editor. If the component has nothing to render it will not export this method.

- **?plugins(opts: Object):** [Plugins](#plugins)\
  This injects the superpowers :mage: to your component. Fantasy aside: you can pretty do anything to your node/mark with Plugins.

- **?commands:** [CommandObject](#commandobject)

- **?defaultKeys:** [KeybindingsObject](#keybindingsobject)

### Spec

An object with the following fields:

- **type**: `'node'` | `'mark'`\
  This is a Prosemirror concept which divides the spec in two groups `node` type or `mark` type. Please read {{global.link.UnderstandingBangleGuide}} guide.

- **?topNode**: boolean\
  Whether the node will be the top node for the document. By default the `doc` node is the top node for Bangle. There can only be one top `node` and is only applicable for `node` types.

- **name**: string\
  The name of the node or mark.

- **schema**: {{Prosemirror.NodeSpec}} | {{Prosemirror.MarkSpec}}

- **?markdown**: {toMarkdown: fn(), parseMarkdown: object}\
  Read the {{global.link.MarkdownGuide}} for more details.

- **?options**: object\
  Use this to save data in this spec. You can use this field to save some data options to make it available to anyone having access to specRegistry.

### Plugins

:brain: _Please note this is a **recursive** type - it contains reference to itself!_

> {{Prosemirror.PluginSpec}} | [Plugins](#plugins)\[\] | fn({ schema, specRegistry }) -> [Plugins](#plugins) | undefined

This is designed in a way to provide flexibility and extensibility when grouping multiple plugins under a {{core.link.Component}}. Please checkout the {{global.link.EditorOperationsGuide}} for a more hands on guide.

### KeybindingsObject

> { \[string\]: string | undefined }

An object which defines the keybindings that are active for a given component. The keys are the name given to an action and the value is valid [w3c-keyname](https://github.com/marijnh/w3c-keyname#readme). Setting a key to undefined will make it a `no-op`.

In the example below, it tells that an action named `moveUp` will be executed when a user presses `Alt` and `ArrowUp` key.

```
{
  'moveUp': 'Alt-ArrowUp'
}
```

:book: **Please checkout the {{global.link.KeybindingsGuide}}**

### CommandObject

> { \[string\]: fn(opts: object) -> [Command](#command) }

A collection of commands exported by a component.

## Command

> fn(state: {{Prosemirror.EditorState}}, ?dispatch: {{Prosemirror.Dispatch}}, ?view: {{Prosemirror.EditorView}}) -> boolean

A function that carries out a bunch of transformations in the editor. The return value indicates whether it was executed or not. For example, running a [toggleBold](#bold-component) command on a code block will return `false` to indicate command did not execute, however it will return `true` when run on a paragraph.

If a `dispatch` callback is **not** passed, the command will run in dry run mode -- it will pretend to do things but will actually make **no changes** to the editor.

:bulb: _Bangle's API will **always** export a higher order function which then returns a Command, which means it will not export a Command directly. It is designed this way to allow for configurability and to keep the command params predictable --_ `(config) => (state, dispatch, view) => boolean`.

Please read {{global.link.EditorOperationsGuide}} guide for more details.

## QueryCommand

> fn(state: {{Prosemirror.EditorState}}) -> T

This is a special type of command which makes no changes to the editor but queries the editor state and returns the value.

:bulb: _BangleJS follows the convention of prefixing_ `query` _to **any** function that returns a QueryCommand._

```js
import { heading } from '@banglejs/core';

const isActive = heading.commands.queryIsHeadingActive(3)(state); // true or false
```

In the example above, [queryIsHeadingActive](#heading-component) queries the editor state's selection for a node with name `heading` having a level of `3`.

## BangleEditor

> new BangleEditor(element, options)

Initializes and mounts the editor in your application. Create an editor instance with following params:

- **element:** : [dom.Node](https://developer.mozilla.org/en-US/docs/Web/API/Node)

- **options:** Object \
  Has the following named parameters

  - **state:** {{core.link.BangleEditorState}}\
    The editor state object.

  - **?focusOnInit:** boolean=true\
    Focus the editor after initialization.

  - **?pmViewOpts**: [Prosemirror.DirectEditorProps](https://prosemirror.net/docs/ref/#view.DirectEditorProps) \
    An object containing PM's editor props.

The class exposes the following fields/methods:

- **focusView()**: void\
  Focus the editor.

- **destroy():** void\
  Destroy the editor instance.

- **toHTMLString():** string\
  Returns the HTML representation of editors content.

- **view:** Prosemirror.EditorView

**Usage**

```js
import { BangleEditor, BangleEditorState } from '@banglejs/core';

// 'editor' is the id of the dom Node on which bangle will
// be mounted.
const editorNode = document.getElementById('editor');

const state = new BangleEditorState({
  initialValue: 'Hello world!',
});

const editor = new BangleEditor(editorNode, { state });

const view = editor.view;
// Programmatically type
view.dispatch(view.state.tr.insertText('Wow'));
```

:book: See {{example.BangleMarkdownExample}}

## BangleEditorState

> new BangleEditorState(options)

Create an editor state instance with following params:

- **options:** Object

  - **?specRegistry:** {{core.link.SpecRegistry}}\
    The SpecRegistry of your editor. Note: you can either set `specRegistry` or `specs` but _not_ both.

  - **?specs:** [Spec](#spec)\[\]\
    A shorthand which initializes SpecRegistry for you behind the scenes. Use this if you don't care about creating and managing a SpecRegistry instance. Note: you can either set `specRegistry` or `specs` but _not_ both.

  - **?plugins:** {{core.link.Plugins}}\[\]\
    The list of plugins for your editor.

  - **?initialValue:** string | htmlString \
    The initial content of the editor.

  - **editorProps:** {{Prosemirror.EditorProps}}

  - **?pmStateOpts:** [Prosemirror.EditorStateCreateConfig](https://prosemirror.net/docs/ref/#state.EditorState%5Ecreate)

The class exposes the following fields/methods:

- **specRegistry:** [SpecRegistry](#specregistry)

- **pmState:** {{Prosemirror.EditorState}}

**Usage**

See usage of [BangleEditor](#bangleeditor).

## SpecRegistry

> new SpecRegistry(specs, options)

A wrapper class which sets up the {{Prosemirror.Schema}}. SpecRegistry combines and merges all the [spec](#spec)'s of your components.

Params:

- **?specs:** [Spec](#spec)\[\]\
  An array containing the specs. Note: the order of specs matters.

- **?options:** Object

  - **?defaultSpecs:** boolean=true\
    Automatically include critical spec`doc`, `text` & `paragraph` if they are **not** already provided in the `specs` param.

The class exposes the following fields/methods:

- **schema:** {{Prosemirror.Schema}}\
  The Prosemirror schema instance associated with the specRegistry. This comes in handy when dealing directly with Prosemirror libraries.

- **options:** Object<name, object>\
  A dictionary of the key value pair of `node` or`mark` name and the option field in their [spec](#spec).

**Usage**

In the example below, we are loading a bunch of specs & plugins.

```js
import { bulletList, listItem, orderedList, bold, link } from '@banglejs/core';

const specRegistry = new SpecRegistry([
  link.spec(),
  bold.spec(),
  bulletList.spec(),
  listItem.spec(),
  orderedList.spec(),
]);
const plugins = [
  link.plugins(),
  bold.plugins(),
  bulletList.plugins(),
  listItem.plugins(),
  orderedList.plugins(),
];
const editorNode = document.queryElement('#editor');
const state = new BangleEditorState({
  specRegistry,
  plugins,
  initialValue: 'Hello world!',
});
const editor = new BangleEditor(editorNode, { state });
```

## Components

The following is a list of components exported by this package.

### blockquote: {{core.link.Component}}

Enables blockquote in your editor. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Toggle the markdown shortcut for creating a blockquote. If enabled, type `>` followed by a space to create one.

#### defaultKeys: {{core.link.Keybindings}}

- **wrapIn**=`Ctrl-ArrowRight`: wrap text in blockquote.

- **moveDown**=`Alt-ArrowDown`: move blockquote down

- **moveUp**=`Alt-ArrowUp`: move blockquote up

- **emptyCopy**=`Mod-c`: {{core.text.emptyCopy}}

- **emptyCut**=`Mod-x`: {{core.text.emptyCut}}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {{core.text.insertEmptyParaAbove}}

- **insertEmptyParaBelow**=`Mod-Enter`: {{core.text.insertEmptyParaBelow}}

#### commands: {{core.link.CommandObject}}

- **queryIsBlockQuoteActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a blockquote or not.

**Usage**

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

### bold: {{core.link.Component}}

Allows text in your editor to be marked as bold. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Toggle the markdown shortcut for creating a bold mark. If enabled, type `**text**` to create the mark.

#### defaultKeys: {{core.link.Keybindings}}

- **toggleBold** = `Mod-b`: toggle bold mark

#### commands: {{core.link.CommandObject}}

- **toggleBold**(): {{core.link.Command}}\
  Toggles bold mark.

- **queryIsBoldActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a bold mark or not.

**Usage**

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

### bulletList: {{core.link.Component}}

Enables bulletList `<ul/>`. **Requires node components with names** `orderedList` & `listItem` to work. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating a bullet list. If enabled, type `-`, `*` or `+` followed by a space to create a bullet list on an empty paragraph.

#### defaultKeys: {{core.link.Keybindings}}

- **toggle**=`Shift-Ctrl-8`: Executes `toggleBulletList` command.

#### commands: {{core.link.CommandObject}}

- **toggleBulletList**(): {{core.link.Command}}\
  Convert to a bulletList and if already a bulletList, convert it to a paragraph node.

- **queryIsBulletListActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a bullet list.

**Usage**

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

### code: {{core.link.Component}}

Allows text in your editor to be marked as code. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **escapeAtEdge:** ?Boolean=true\
  Allows automatic escaping of code mark at the edges. This particularly helps to escape code mark by pressing left or right arrow key at the edges.

- **markdownShortcut**: ?Boolean=true\
  Toggle the markdown shortcut for creating a code mark. If enabled, type `` `text` `` to create a code mark.

#### defaultKeys: {{core.link.Keybindings}}

- **toggleCode** = `` Mod-` ``: toggle code mark

#### commands: {{core.link.CommandObject}}

- **toggleCode**(): {{core.link.Command}}\
  Toggles code mark.

- **queryIsCodeActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a code mark or not.

**Usage**

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

### codeBlock: {{core.link.Component}}

Enables `<code/>` in your editor. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?Boolean=true\
  Toggle the markdown shortcut for creating a codeBlock. If enabled, type ` ``` ` to create one.

#### defaultKeys: {{core.link.Keybindings}}

- **toCodeBlock**=`Shift-Ctrl-\`: wraps text in codeBlock.

- **moveDown**=`Alt-ArrowDown`: move codeBlock down

- **moveUp**=`Alt-ArrowUp`: move codeBlock up

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {{core.text.insertEmptyParaAbove}}

- **insertEmptyParaBelow**=`Mod-Enter`: {{core.text.insertEmptyParaBelow}}

#### commands: {{core.link.CommandObject}}

- **queryIsCodeActiveBlock**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a codeBlock or not.

**Usage**

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

### doc: {{core.link.Component}}

**Top** level node needed by the editor to contain every other node. The spec & plugins for this component are **required** for Bangle to function, if a spec named `doc` is not defined, Bangle will automatically default to this one.

#### spec(): {{core.link.NodeSpec}}

Returns a node spec with [topNode](#spec) set to `true`, read more {{global.link.UnderstandingBangleGuide}}.

### heading: {{core.link.Component}}

Enables headings of various levels in your editor. {{global.link.MarkdownSupport}}

#### spec({ ... }): {{core.link.NodeSpec}}

Named parameters:

- **levels**: ?number\[\]=\[1,2,3,4,5,6\] \
  The allowed levels for the heading, think `<h1/>`, `<h2/>` and so on. The array must be contiguous and the first element must be `1` and the last element must be less than or equal to `6`.

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?Boolean=true\
  Toggle the markdown shortcut for heading. If enabled, type `#` followed by a space to create one a level one heading.

#### defaultKeys: {{core.link.Keybindings}}

- **toH1**=`Shift-Ctrl-1`: Convert a node to heading of level 1. Is a no-op if the level `1` is disallowed.

- **toH2**=`Shift-Ctrl-2`: Convert a node to heading of level 2. Is a no-op if the level `2` is disallowed.

- **toH3**=`Shift-Ctrl-3`: Convert a node to heading of level 3. Is a no-op if the level `3` is disallowed.

- **toH4**=`Shift-Ctrl-4`: Convert a node to heading of level 4. Is a no-op if the level `4` is disallowed.

- **toH5**=`Shift-Ctrl-5`: Convert a node to heading of level 5. Is a no-op if the level `5` is disallowed.

- **toH6**=`Shift-Ctrl-6`: Convert a node to heading of level 6. Is a no-op if the level `6` is disallowed.

- **moveDown**=`Alt-ArrowDown`: move heading down

- **moveUp**=`Alt-ArrowUp`: move heading up

- **emptyCopy**=`Mod-c`: {{core.text.emptyCopy}}

- **emptyCut**=`Mod-x`: {{core.text.emptyCut}}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {{core.text.insertEmptyParaAbove}}

- **insertEmptyParaBelow**=`Mod-Enter`: {{core.text.insertEmptyParaBelow}}

#### commands: {{core.link.CommandObject}}

- **toggleItalic**(level: `number=3`): {{core.link.Command}}\
  Toggles text into heading of a given `level` and vice versa.

- **queryIsHeadingActive**(level:`number=3`): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a heading of given `level`.

**Usage**

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

### history: {{core.link.Component}}

Enables history in your editor, this is a wrapper for the prosemirror's [history module](https://prosemirror.net/docs/ref/#history). **Unless you are overriding this component, it will be included by default.**

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **historyOpts**: Object \
  see the Prosemirror history `config` [docs](https://prosemirror.net/docs/ref/#history.history%5Econfig) for the API.

#### defaultKeys: {{core.link.Keybindings}}

- **undo**=`Mod-x`

- **redo**=`Mod-y Shift-Mod-z`

#### commands: {{core.link.CommandObject}}

- **undo**(): {{core.link.Command}}\
  Undoes the last step.

- **redo**(): {{core.link.Command}}\
  Redoes the last step.

### hardBreak: {{core.link.Component}}

Enables the `<br />` element in your editor.

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **insert** = `Shift-Enter`: inserts a hard break

**Usage**

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

### horizontalRule: {{core.link.Component}}

Enables a horizontal (`<hr />`) rule component in your editor. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Toggle the markdown shortcut for creating a horizontalRule. Type `---` and `___` to insert a horizontal rule.

**Usage**

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

### image: {{core.link.Component}}

Enables images in your editor.

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **handleDragAndDrop:** ?boolean=true \
  Toggle the functionality of dragging, dropping and pasting of images into the editor.

**Usage**

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

### italic: {{core.link.Component}}

Allows text in your editor to be marked as italic. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Toggle the markdown shortcut for creating am italic mark. If enabled, type `_text_` to enable italic mark.

#### defaultKeys: {{core.link.Keybindings}}

- **toggleItalic** = `Mod-i`: toggle an italic mark

#### commands: {{core.link.CommandObject}}

- **toggleItalic**(): {{core.link.Command}}\
  Toggles italic mark.

- **queryIsItalicActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside an italic mark or not.

**Usage**

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

### link: {{core.link.Component}}

Allows text in your editor to be marked as link.

#### spec({ ... }): {{core.link.MarkSpec}}

Named parameters:

- **openOnClick**: ?boolean=false\
  If enabled clicking a link will open the link in new tab. If disabled, clicking a link will set the cursor on it.

#### plugins(): {{core.link.Plugins}}

#### commands: {{core.link.CommandObject}}

- **createLink**(href : string): {{core.link.Command}}\
  Creates a link mark on the selection text.

- **updateLink**(href : ?string): {{core.link.Command}}\
  Updates a link mark on the selection text with `href`. Set `href` to `undefined` to clear the link mark. If selection is empty, it will update the parent text node.

- **queryLinkAttrs**(): {{typedQueryCommand "?{href: string, text: string}"}}\
  Returns the details of the link mark in selection.

- **queryIsLinkAllowedInRange**(from: number, to: number): {{typedQueryCommand "boolean"}}\
  Queries if the range allows for creation of link mark.

- **queryIsLinkActive**(): {{typedQueryCommand "boolean"}}\
  Queries if the selection is in a link mark.

- **queryIsSelectionAroundLink**(): {{typedQueryCommand "boolean"}}\
  Queries if the selection is around a link mark.

**Usage**

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

### listItem: {{core.link.Component}}

Creates a listItem `<li/>`. **Requires node components with names** `bulletList` and `orderedList` to work

#### spec({ ... }): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **indent**=`Tab`: Indents the listItem

- **outdent**=`Shift-Tab`: Outdents the listItem

- **moveDown**=`Alt-ArrowDown`: move listItem down

- **moveUp**=`Alt-ArrowUp`: move listItem up

- **emptyCopy**=`Mod-c`: {{core.text.emptyCopy}}

- **emptyCut**=`Mod-x`: {{core.text.emptyCut}}

- **insertEmptyListAbove**=`Mod-Shift-Enter`: Insert a new list above the current list and move cursor to it.

- **insertEmptyListBelow**=`Mod-Enter`: Insert a new list below the current list and move cursor to it.

#### commands: {{core.link.CommandObject}}

- **indentListItem**(): {{core.link.Command}}\
  Indents list item one level. Can only indent 1 plus the parent's level.

- **outdentListItem**(): {{typedQueryCommand "boolean"}}\
  Outdents list item one level. If level is root, outdents to a paragraph.

**Usage**

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

### orderedList: {{core.link.Component}}

Enables orderedList `<ol/>`. **Requires node components with names** `bulletList`, `listItem` to work. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Enable the markdown shortcut for creating an ordered list. Type `1.` followed by a space to create an ordered list.

#### defaultKeys: {{core.link.Keybindings}}

- **toggle**=`Shift-Ctrl-9`: Executes `toggleOrderedList` command.

#### commands: {{core.link.CommandObject}}

- **toggleOrderedList**(): {{core.link.Command}}\
  Convert to an orderedList and if already an orderedList, convert it to a paragraph node.

- **queryIsSelectionInsideOrderedList**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside an ordered list.

**Usage**

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

### paragraph: {{core.link.Component}}

Enables paragraph (`<p/>` in html) nodes in your editor. The spec for this component are **required** for Bangle to function, if a spec with a name=`paragraph` is not specified, Bangle will automatically default to this one.

#### spec(): {{core.link.NodeSpec}}

Returns a spec, read more {{global.link.UnderstandingBangleGuide}}.

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **jumpToStartOfParagraph**=`Ctrl-a (mac) Ctrl-Home (linux/pc)`: Executes the `jumpToStartOfParagraph` command (see commands below).

- **jumpToEndOfParagraph**=`Ctrl-a (mac) Ctrl-Home (linux/pc)`: Executes the `jumpToEndOfParagraph` command (see commands below).

- **moveDown**=`Alt-ArrowDown`: Move paragraph down.

- **moveUp**=`Alt-ArrowUp`: Move paragraph up.

- **emptyCopy**=`Mod-c`: {{core.text.emptyCopy}}

- **emptyCut**=`Mod-x`: {{core.text.emptyCut}}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {{core.text.insertEmptyParaAbove}}

- **insertEmptyParaBelow**=`Mod-Enter`: {{core.text.insertEmptyParaBelow}}

- **toggleParagraph**=`Ctrl-Shift-0`: Toggles a node to paragraph and vice versa.

#### commands: {{core.link.CommandObject}}

- **jumpToStartOfParagraph**(): {{core.link.Command}}\
  Jumps the cursor to the start of paragraph.

- **jumpToEndOfParagraph**(): {{core.link.Command}}\
  Jumps the cursor to the end of paragraph.

- **convertToParagraph**(): {{core.link.Command}}\
  Coverts the node in selection to paragraph type.

- **queryIsParagraph**(): {{typedQueryCommand "boolean"}}\
  Query if it is paragraph under the selection.

- **queryIsTopLevelParagraph**(): {{typedQueryCommand "boolean"}}\
  Query if it is paragraph under the selection and it is a direct descendant of the top level node, which by default is [doc](#doc-component).

**Usage**

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

### strike: {{core.link.Component}}

Allows text in your editor to be marked as strike.

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **toggleStrike** = `Mod-d`: toggle a strike mark

#### commands: {{core.link.CommandObject}}

- **toggleStrike**(): {{core.link.Command}}\
  Toggles strike mark.

- **queryIsStrikeActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a strike mark or not.

**Usage**

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

### text: {{core.link.Component}}

The text node which the editor uses to wrap the text. The spec for this component are **required** for Bangle to function, if a spec named `text` is not defined, Bangle will automatically default to this one.

#### spec(): {{core.link.NodeSpec}}

Creates a todoItem node spec with `done` attribute, read more {{global.link.UnderstandingBangleGuide}}.

### todoItem: {{core.link.Component}}

Creates a todoItem with a `done` attribute. **Requires node components with names** `todoList`, `bulletList`,`orderedList` & `listItem` to work

#### spec({ ... }): {{core.link.NodeSpec}}

Named parameters:

- **nested**: boolean=true\
  Allows nesting of todo items.

- **draggable**: boolean=true\
  Make todo items draggable.

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **nodeView**: boolean=true\
  If `true`, will use the default todoItem nodeView. Set it to `false` to disable the default todoItem nodeView. The typical use-case for setting it to `false` is when you want to use a custom nodeView for todoItem. See the {{core.link.nodeViews}} section for more details.

#### defaultKeys: {{core.link.Keybindings}}

- **toggleDone**=`Ctrl-Enter (mac) Ctrl-I (linux/windows)`: Toggles the todo item's done status.

- **indent**=`Tab`: Indents the todo item

- **outdent**=`Shift-Tab`: Outdents the todo item

- **moveDown**=`Alt-ArrowDown`: move todoItem down

- **moveUp**=`Alt-ArrowUp`: move todoItem up

- **emptyCopy**=`Mod-c`: {{core.text.emptyCopy}}

- **emptyCut**=`Mod-x`: {{core.text.emptyCut}}

- **insertEmptyParaAbove**=`Mod-Shift-Enter`: {{core.text.insertEmptyParaAbove}}

- **insertEmptyParaBelow**=`Mod-Enter`: {{core.text.insertEmptyParaBelow}}

#### commands: {{core.link.CommandObject}}

- **toggleTodoItemDone**(): {{core.link.Command}}\
  Toggle the done attribute of the todo item in the selection.

- **queryTodoItemAttrs**(): {{typedQueryCommand "?{done: boolean}"}}\
  Query the todo item attributes.

**Usage**

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

### todoList: {{core.link.Component}}

A wrapper node component for `todoItem`, similar to how `orderedList` is a wrapper for `listItem`. **Requires node components with names** `todoItem`, `bulletList`,`orderedList` & `listItem` to work. {{global.link.MarkdownSupport}}

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=true\
  Enable the markdown shortcut for creating a todo list. Type `[ ]` or `[]` followed by a space to create an unchecked todoList.

#### defaultKeys: {{core.link.Keybindings}}

- **toggle**=`Shift-Ctrl-7`: Executes `toggleTodoList` command.

#### commands: {{core.link.CommandObject}}

- **toggleTodoList**(): {{core.link.Command}}\
  Convert to an todoList and if already an todoList, convert it to a paragraph node.

- **queryIsTodoListActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a todo list.

**Usage**

See [todoitem](#todoitem-component) usage.

### underline: {{core.link.Component}}

Allows text in your editor to be marked with underlined style.

#### spec(): {{core.link.MarkSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

#### defaultKeys: {{core.link.Keybindings}}

- **toggleUnderline** = `Mod-u`: toggle an underline mark

#### commands: {{core.link.CommandObject}}

- **toggleUnderline**(): {{core.link.Command}}\
  Toggles underline mark.

- **queryIsUnderlineActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside an underline mark or not.

**Usage**

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
