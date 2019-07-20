# prosemirror-example-setup

[ [**WEBSITE**](http://prosemirror.net) | [**ISSUES**](https://github.com/prosemirror/prosemirror-example-setup/issues) | [**FORUM**](https://discuss.prosemirror.net) | [**GITTER**](https://gitter.im/ProseMirror/prosemirror) ]

This is a non-core example module for [ProseMirror](http://prosemirror.net).
ProseMirror is a well-behaved rich semantic content editor based on
contentEditable, with support for collaborative editing and custom
document schemas.

This module provides an example of the glue code one might write to
tie the modules that make up ProseMirror into an actual presentable
editor. It is not meant to be very reusable, though it might be
helpful to get something up-and-running quickly.

The [project page](http://prosemirror.net) has more information, a
number of [examples](http://prosemirror.net/examples/) and the
[documentation](http://prosemirror.net/docs/).

This code is released under an
[MIT license](https://github.com/prosemirror/prosemirror/tree/master/LICENSE).
There's a [forum](http://discuss.prosemirror.net) for general
discussion and support requests, and the
[Github bug tracker](https://github.com/prosemirror/prosemirror-example-setup/issues)
is the place to report issues.

## Documentation

This module exports the following items:

**`exampleSetup`**`(options: Object) → [Plugin]`

Create an array of plugins pre-configured for the given schema. The
resulting array will include the following plugins:

 * Input rules for smart quotes and creating the block types in the
   schema using markdown conventions (say `"> "` to create a
   blockquote)

 * A keymap that defines keys to create and manipulate the nodes in the
   schema

 * A keymap binding the default keys provided by the
   prosemirror-commands module

 * The undo history plugin

 * The drop cursor plugin

 * The gap cursor plugin

 * A custom plugin that adds a `menuContent` prop for the
   prosemirror-menu wrapper, and a CSS class that enables the
   additional styling defined in `style/style.css` in this package

These options are supported:

 * **`schema`**`: Schema`\
   The schema to use. This influences the menu items and key bindings
   that are generated. Assumes that node names correspond to those in
   the schema modules in the main distribution.

 * **`mapKeys`**`: ?Object`\
   Can be used to [adjust](#build-key-map) the key
   bindings created.

 * **`menuBar`**`: ?bool`\
   Set to false to disable the menu bar.

 * **`floatingMenu`**`: ?bool`\
   Set to false to make the menu bar non-floating.

 * **`menuContent`**`: [[MenuItem]]`\
   Can be used to override the menu content.

 * **`history`**: ?bool\
   Set this to `false` to disable adding the history plugin to the
   result.

**`buildMenuItems`**(schema: Schema) → Object

Given a schema, look for default mark and node types in it and
return an object with relevant menu items relating to those marks:

 * **`toggleStrong`**`: MenuItem`\
   A menu item to toggle the [strong mark](#schema-basic.StrongMark).

 * **`toggleEm`**`: MenuItem`\
   A menu item to toggle the [emphasis mark](#schema-basic.EmMark).

 * **`toggleCode`**`: MenuItem`\
   A menu item to toggle the [code font mark](#schema-basic.CodeMark).

 * **`toggleLink`**`: MenuItem`\
   A menu item to toggle the [link mark](#schema-basic.LinkMark).

 * **`insertImage`**`: MenuItem`\
   A menu item to insert an [image](#schema-basic.Image).

 * **`wrapBulletList`**`: MenuItem`\
   A menu item to wrap the selection in a [bullet list](#schema-list.BulletList).

 * **`wrapOrderedList`**`: MenuItem`\
   A menu item to wrap the selection in an [ordered list](#schema-list.OrderedList).

 * **`wrapBlockQuote`**`: MenuItem`\
   A menu item to wrap the selection in a [block quote](#schema-basic.BlockQuote).

 * **`makeParagraph`**`: MenuItem`\
   A menu item to set the current textblock to be a normal
   [paragraph](#schema-basic.Paragraph).

 * **`makeCodeBlock`**`: MenuItem`\
   A menu item to set the current textblock to be a
   [code block](#schema-basic.CodeBlock).

 * **`insertTable`**`: MenuItem`\
   An item to insert a [table](#schema-table).

 * **`addRowBefore`**, **`addRowAfter`**, **`removeRow`**, **`addColumnBefore`**, **`addColumnAfter`**, **`removeColumn`**`: MenuItem`\
   Table-manipulation items.

 * **`makeHead[N]`**`: MenuItem`\
   Where _N_ is 1 to 6. Menu items to set the current textblock to
   be a [heading](#schema-basic.Heading) of level _N_.

 * **`insertHorizontalRule`**`: MenuItem`\
   A menu item to insert a horizontal rule.

The return value also contains some prefabricated menu elements and
menus, that you can use instead of composing your own menu from
scratch:

 * **`insertMenu`**`: Dropdown`\
   A dropdown containing the `insertImage` and
   `insertHorizontalRule` items.

 * **`typeMenu`**`: Dropdown`\
   A dropdown containing the items for making the current
   textblock a paragraph, code block, or heading.

 * **`fullMenu`**`: [[MenuElement]]`\
   An array of arrays of menu elements for use as the full menu
   for, for example the [menu bar](#menu.MenuBarEditorView).

<a name="build-key-map"></a>**`buildKeymap`**`(schema: Schema, remap: ?Object) → Object`

Inspect the given schema looking for marks and nodes from the
basic schema, and if found, add key bindings related to them.
This will add:

* **Mod-b** for toggling [strong](#schema-basic.StrongMark)
* **Mod-i** for toggling [emphasis](#schema-basic.EmMark)
* **Mod-`** for toggling [code font](#schema-basic.CodeMark)
* **Ctrl-Shift-0** for making the current textblock a paragraph
* **Ctrl-Shift-1** to **Ctrl-Shift-Digit6** for making the current
  textblock a heading of the corresponding level
* **Ctrl-Shift-Backslash** to make the current textblock a code block
* **Ctrl-Shift-8** to wrap the selection in an ordered list
* **Ctrl-Shift-9** to wrap the selection in a bullet list
* **Ctrl->** to wrap the selection in a block quote
* **Enter** to split a non-empty textblock in a list item while at
  the same time splitting the list item
* **Mod-Enter** to insert a hard break
* **Mod-_** to insert a horizontal rule

You can suppress or map these bindings by passing a `mapKeys`
argument, which maps key names (say `"Mod-B"` to either `false`, to
remove the binding, or a new key name string.

**`buildInputRules`**`(schema: Schema) → [InputRule]`

A set of input rules for creating the basic block quotes, lists,
code blocks, and heading.

We aim to be an inclusive, welcoming community. To make that explicit,
we have a [code of
conduct](http://contributor-covenant.org/version/1/1/0/) that applies
to communication around the project.
