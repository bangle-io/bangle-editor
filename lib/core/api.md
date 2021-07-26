---
title: '@bangle.dev/core'
sidebar_label: '@bangle.dev/core'
packageName: '@bangle.dev/core'
id: 'core'
---

`@bangle.dev/core` as the name suggests is the core of Bangle and most packages expect it as a [peer dependency](https://nodejs.org/en/blog/npm/peer-dependencies/). To install run:

```
{{npmInstallation "@bangle.dev/core"}}
```

{{global.useRightSidebar}}

## Component

The building block of Bangle is a component. At it's heart, we have a vanilla Javascript module which exports the follow properties:

- **?spec(opts: Object):** [Spec](#spec)\
  The specification which defines how the component will be rendered in the Editor. If the component has nothing to render it will not export this method.

- **?plugins(opts: Object):** [Plugins](#plugins)\
  This injects the superpowers :mage: to your component. Fantasy aside: you can pretty do anything to your node/mark with Plugins.

- **?commands:** [CommandObject](#commandobject)

- **?defaultKeys:** [KeybindingsObject](#keybindingsobject)

### Spec

An object with the following fields:

- **type**: `'node'` | `'mark'`\
  This is a Prosemirror concept which divides the spec in two groups `node` type or `mark` type. Please checkout {{global.link.YourFirstEditorGuide}} guide.

- **topNode**: ?boolean\
  Whether the node will be the top node for the document. By default the `doc` node is the top node for Bangle. There can only be one top `node` and is only applicable for `node` types.

- **name**: string\
  The name of the node or mark.

- **schema**: {{Prosemirror.NodeSpec}} | {{Prosemirror.MarkSpec}}

- **markdown**: ?{toMarkdown: fn(), parseMarkdown: object}\\

- **options**: ?object\
  Use this to save data in this spec. You can use this field to save some data options to make it available to anyone having access to specRegistry.

### Plugins

:brain: _Please note this is a **recursive** type - it contains reference to itself!_

> {{Prosemirror.PluginSpec}} | [Plugins](#plugins)\[\] | (fn({ schema, specRegistry, metadata }) -> [Plugins](#plugins)) | undefined

This is designed in a way to provide flexibility and extensibility when grouping multiple plugins under a {{core.link.Component}}. Please checkout this [example](/docs/examples/exporting-data#persisting-to-local-storage) on how to create a small plugin or read the source code of some of the core components.

### Plugin

> {{Prosemirror.PluginSpec}}

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

Please read {{global.link.EditorOperationsGuide}} for more details.

## QueryCommand

> fn(state: {{Prosemirror.EditorState}}) -> T

This is a special type of command which makes no changes to the editor but queries the editor state and returns the value.

:bulb: _Bangle follows the convention of prefixing_ `query` _to **any** function that returns a QueryCommand._

```js
import { heading } from '@bangle.dev/base-components';

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

  - **focusOnInit:** ?boolean=true\
    Focus the editor after initialization.

  - **pmViewOpts**: ?[Prosemirror.DirectEditorProps](https://prosemirror.net/docs/ref/#view.DirectEditorProps) \
    An object containing PM's editor props.

The class exposes the following fields/methods:

- **focusView()**: void\
  Focus the editor.

- **destroy():** void\
  Destroy the editor instance.

- **toHTMLString():** string\
  Returns the HTML representation of editors content.

- **view:** {{Prosemirror.EditorView}}

**Usage**

```js
import { BangleEditor, BangleEditorState } from '@bangle.dev/core';

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

  - **specRegistry:** ?{{core.link.SpecRegistry}}\
    The SpecRegistry of your editor. Note: you can either set `specRegistry` or `specs` but _not_ both.

  - **specs:** ?[Spec](#spec)\[\]\
    A shorthand which initializes SpecRegistry for you behind the scenes. Use this if you don't care about creating and managing a SpecRegistry instance. :warning: Note: you can either set `specRegistry` or `specs` but _not_ both.

  - **plugins:** ?({ schema, specRegistry, metadata }) -> {{core.link.Plugins}}\[\]\
    The list of plugins for your editor.

  - **pluginMetadata**: ?Object\
    An object that will be then passed to any plugin (see the `options.plugins` ) as a `metadata` named parameter. Use this to relay any information about the editor to a plugin.

  - **initialValue:** string | htmlString | undefined \
    The initial content of the editor.

  - **editorProps:** {{Prosemirror.EditorProps}}

  - **pmStateOpts:** ?[Prosemirror.EditorStateCreateConfig](https://prosemirror.net/docs/ref/#state.EditorState%5Ecreate)

The class exposes the following fields/methods:

- **specRegistry:** [SpecRegistry](#specregistry)

- **pmState:** {{Prosemirror.EditorState}}

**Usage**

See usage of [BangleEditor](#bangleeditor).

## SpecRegistry

> new SpecRegistry(specs, options)

A wrapper class which sets up the {{Prosemirror.Schema}}. SpecRegistry combines and merges all the [spec](#spec)'s of your components.

Params:

- **specs:** ?[Spec](#spec)\[\]\
  An array containing the specs. Note: the order of specs matters.

- **options:** ?Object

  - **defaultSpecs:** ?boolean=true\
    Automatically include critical spec`doc`, `text` & `paragraph` if they are **not** already provided in the `specs` param.

The class exposes the following fields/methods:

- **schema:** {{Prosemirror.Schema}}\
  The Prosemirror schema instance associated with the specRegistry. This comes in handy when dealing directly with Prosemirror libraries.

- **options:** Object<name, object>\
  A dictionary of the key value pair of `node` or`mark` name and the option field in their [spec](#spec).

**Usage**

In the example below, we are loading a bunch of specs & plugins.

```js
import {
  SpecRegistry,
  BangleEditorState,
  BangleEditor
} from '@bangle.dev/core';
import {
  bulletList,
  listItem,
  orderedList,
  bold,
  link
} from '@bangle.dev/base-components';

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