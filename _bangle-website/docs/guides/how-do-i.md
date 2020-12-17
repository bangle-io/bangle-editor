---
title: How do I?
sidebar_label: How do I?
---

In this page we answer a list of commonly asked things

### How do I watch for changes to the editor?

Create a plugin that watches changes to the editor, see [exporting data](/docs/examples/exporting-data) for an example.

### How do I handle editor's DOM events ?

Create a plugin which listens to DOM events as show below:

```js
new Plugin({
  key: new PluginKey('myDropPlugin'),
  props: {
    handleDOMEvents: {
      drop(view, event) {
        // your logic
      },
    },
  },
});
```

:bulb: See [Prosemirror.EditorProps](https://prosemirror.net/docs/ref/#view.EditorProps) for the API.

### How do I add a keyboard shortcut ?

:book: See {{global.link.KeybindingsGuide}}

### How do I execute a command ?

If you are using the vanilla setup, you can get access to `view` from the [editor](/docs/api/core#bangleeditor) instance. For example

```js
const editor =  new BangleEditor({ ... })
const view = editor.view
const state = view.state
const dispatch = view.dispatch

// dry run a command
const success = toggleBold()(view.state);
// execute the command
toggleBold()(view.state, view.dispatch, view);
```

In a React setup you can get the `view` from the hook [useEditorViewContext](/docs/api/react#useeditorviewcontext-reacthook) for components rendered inside the `<BangleEditor />`. For components
outside `<BangleEditor />`, save the `editor` in your applications state management for retrieval and access. Don't forget to clean it up when you editor is destroyed.

### How do I get access to the `view`, `state`, `dispatch` for a command?

See `### How do I execute a command ?` above.

### How do I get access to Prosemirror schema ?

If you are using `specs:[ ... ]` notation, switch to using [SpecRegistry](/docs/api/core#specregistry).

```js
const specRegistry = new SpecRegistry([]);
const schema = specRegistry.schema;
```

### How do I change the selection ?

First, you will need to figure out whether you want a [TextSelection](https://prosemirror.net/docs/ref/#state.TextSelection) (majority of the cases) or a [NodeSelection](https://prosemirror.net/docs/ref/#state.NodeSelection). Below is an example of setting selection to the end:

```js
const setSelectionAtEnd = (state, dispatch) => {
  const textSelection = TextSelection.create(
    state.doc,
    state.doc.content.size - 1,
  );
  // doing this creates a new Transaction
  const tr = state.tr;
  // this convention allows for dry running of a command
  if (dispatch) {
    dispatch(tr.setSelection(textSelection));
  }
  // return the success of the command
  return true;
};
```

### How do I programmatically update the doc content?

This is a pretty heavy question as this requires Prosemirror knowledge of dealing with `transactions`. To get started read up on

- Read the [Prosemirror guide](https://prosemirror.net/docs/guide/#transform) at least 3 times.
- Browse the source code of some of your favourite components to get a hang of
  carrying out transactions.
- Checkout [prosemirror-utils](https://github.com/atlassian/prosemirror-utils) for more code examples.

### How do I create a new paragraph node ?

Below is an example of how you can create a new paragraph node:

```js
const { doc, schema, tr } = view.state;
const type = schema.nodes.paragraph;
// Insert a paragraph node at the end of document.
const transaction = tr.insert(doc.content.size, type.create('Hello'));
// Commit it.
view.dispatch(transaction);
```
