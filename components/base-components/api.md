---
title: '@bangle.dev/base-components'
sidebar_label: '@bangle.dev/base-components'
packageName: '@bangle.dev/base-components'
id: 'base_components'
---

`@bangle.dev/base-components` as the name suggests is the core of Bangle and most packages expect it as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/). To install run:

```
{{npmInstallation "@bangle.dev/base-components"}}
```

## Base Components

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

- **queryIsBlockquoteActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a blockquote or not.

**Usage**

```js
import { blockquote } from '@bangle.dev/base-components';

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
import { bold } from '@bangle.dev/base-components';

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

This component implements todo lists by having an attribute `todoChecked` in any of its children `listItem`.

#### spec(): {{core.link.NodeSpec}}

#### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- {{core.text.pluginsParamKeybindings}}

- **markdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating a bullet list. If enabled, type `-`, `*` or `+` followed by a space to create a bullet list on an empty paragraph.

- **todoMarkdownShortcut**: ?boolean=`true`\
  Enable the markdown shortcut for creating a todo list. Type `[ ]` or `[]` followed by a space to create an unchecked todo.

#### defaultKeys: {{core.link.Keybindings}}

- **toggle**=`Shift-Ctrl-8`: Executes `toggleBulletList` command.

#### commands: {{core.link.CommandObject}}

- **toggleBulletList**(): {{core.link.Command}}\
  Convert to a bulletList and if already a bulletList, convert it to a paragraph node.

- **toggleTodoList**(): {{core.link.Command}}\
  Convert to a bulletList with todoChecked attribute but if already a bulletList, convert it to a paragraph node.

- **queryIsBulletListActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a bullet list.

- **queryIsTodoListActive**(): {{typedQueryCommand "boolean"}}\
  Query if the selection has a list item that has `todoChecked` attribute.

**Usage**

```js
import { bulletList, listItem, orderedList } from '@bangle.dev/core-components';

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
import { code } from '@bangle.dev/base-components';

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
  Toggle the markdown shortcut for creating a codeBlock. If enabled, type ```` ``` ```` to create one.

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
import { codeBlock } from '@bangle.dev/base-components';

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

Returns a node spec with [topNode](#spec) set to `true`, read more {{global.link.YourFirstEditorGuide}}.

### heading: {{core.link.Component}}

Enables headings of various levels in your editor {{global.link.MarkdownSupport}}.

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

- **toggleCollapse:** `-`: Toggle collapsing of heading.

#### commands: {{core.link.CommandObject}}

- **toggleHeading**(level: `number=3`): {{core.link.Command}}\
  Toggles text into heading of a given `level` and vice versa.

- **queryIsHeadingActive**(level:`number=3`): {{typedQueryCommand "boolean"}}\
  Query if the selection is inside a heading of given `level`.

- **queryIsCollapseActive**(): {{core.link.Command}}\
  Query if the current heading is collapsed.

- **collapseHeading**(): {{core.link.Command}}\
  Hides every node below that is not heading or has a heading `level` less than that of the current heading.

- **uncollapseHeading**(): {{core.link.Command}}\
  Brings back all the hidden nodes of a collapsed heading. Will only uncollapse shallowly i.e a collapse heading inside of a collapsed heading will not be uncollapsed.

- **toggleHeadingCollapse**(): {{core.link.Command}}\
  Collapses an uncollapsed heading and vice versa.

- **uncollapseAllHeadings**(): {{core.link.Command}}\
  Uncollapses all headings in the `doc`. Will also deep uncollapse every heading that was inside of a collapsed heading.

- **insertEmptyParaAbove**(): {{core.link.Command}}\
  Insert an empty paragraph above

- **insertEmptyParaBelow**(): {{core.link.Command}}\
  Insert an empty paragraph below

**On Heading collapse**

The heading component also allows you to collapse and uncollapse any content, after the current heading, that is not of type heading or has a heading of level greater than the current heading.

:bulb: The collapsed data is saved in the node attribute `collapseContent`, it is also accessible inside the DOM data attribute by accessing `data-bangle-attrs`.

:bulb: A collapsed heading will have a class name of `bangle-heading-collapsed` to allow for styling.

:warning: For serializing to Markdown you will have to uncollapse your document, since markdown doesn't support collapsing. You should run the command`uncollapseAllHeadings` before serializing to markdown.

On top of the collapse commands, the component also exports the following helper functions to help with collapse functionality:

- **listCollapsibleHeading**(state: {{Prosemirror.EditorState}}): \[{node: {{Prosemirror.Node}}, pos: number}\] \
  Lists all the headings that can be collapsed or uncollapsed.

- **listCollapsedHeading**(state: {{Prosemirror.EditorState}}): \[{node: {{Prosemirror.Node}}, pos: number}\]\
  Lists all the headings that are currently collapsed.

- **flattenFragmentJSON**(fragmentJSON: Object): Object\
  Deep flattens any nested collapsed heading in the object. Bangle internally uses this to implement `uncollapseAllHeadings` command. Example `flattenFragmentJSON(node.attrs.collapseContent)`.

**Usage**

```js
import { heading } from '@bangle.dev/base-components';

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
import { hardBreak } from '@bangle.dev/base-components';
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
import { horizontalRule } from '@bangle.dev/base-components';

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

- **acceptFileType:** ?string=image/\*

- **createImageNodes**: ?(files: [File\[\]](https://developer.mozilla.org/en-US/docs/Web/API/File), imageType: [PMNodeType](https://prosemirror.net/docs/ref/#model.NodeType), view: [PMEditorView](https://prosemirror.net/docs/ref/#view.EditorView)) -> `Promise<ImageNode[]>`\
  A callback that is called whenever an image is pasted or drop. You are expected to return a promise of corresponding image nodes. If not provided it will run the default `defaultCreateImageNodes` (see [src](https://github.com/bangle-io/bangle.dev/blob/c7f59191c0f4ae57594c7c67fc5fef8913656dd3/core/components/image.js#L170) code) which inlines the image data. If you want to handle saving the image on a server you will want want to provide this param.

**Usage**

```js
import { image } from '@bangle.dev/base-components';

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
import { italic } from '@bangle.dev/base-components';

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
import { link } from '@bangle.dev/base-components';

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

- **moveListItemUp**(): {{typedQueryCommand "boolean"}}\
  Swap the list item with the one above. If the item above is not a list item, converts the item to paragraph and then moves it.

- **moveListItemDown**(): {{typedQueryCommand "boolean"}}\
  The opposite of `moveListItemUp`.

- **insertEmptySiblingListAbove**(): {{core.link.Command}}\
  Insert an empty list, at the same nesting level, above the current list

- **insertEmptySiblingListBelow**(): {{core.link.Command}}\
  Insert an empty list, at the same nesting level, below the current list.

**Usage**

```js
import { orderedList, bulletList, listItem  } from '@bangle.dev/base-components';

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

// run commands
listItem.insertEmptySiblingListBelow()(state, dispatch);
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
import { orderedList, bulletList, listItem } from '@bangle.dev/base-components';

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

Returns a spec, read more {{global.link.YourFirstEditorGuide}}.

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

- **convertToParagraph**=`Ctrl-Shift-0`: Toggles a node to paragraph and vice versa.

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

- **insertEmptyParagraphAbove():** {{typedQueryCommand "boolean"}}\
  Inserts an empty paragraph above the current node.

- **insertEmptyParagraphBelow():** {{typedQueryCommand "boolean"}}\
  Inserts an empty paragraph below the current node.

**Usage**

```js
import { blockquote } from '@bangle.dev/base-components';

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
import { strike } from '@bangle.dev/base-components';

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
import { underline } from '@bangle.dev/base-components';

const specFactory = [
  // other specs
  underline.spec(),
];

const plugins = [
  // other plugins
  underline.plugins(),
];
```