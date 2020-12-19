---
title: Commands
sidebar_label: Commands and Interactivty
---

Bangle uses the concept of [Commands](/docs/api/core#command) borrowed from [Prosemirror](https://prosemirror.net/docs/guide/#commands) to allow for making changes to your editor.

In the example below we try out some [heading](/docs/api/core#heading-component) commands.

```js
import { heading } from '@banglejs/core';

// Create a command for toggling heading of level 3
const command = heading.commands.toggleHeading(3);

// Execute the command
command(state, dispatch, view);
```

### Executing a command

In the example below we show how to access the view ([Prosemirror.EditorView](https://prosemirror.net/docs/ref/#view.EditorView)) and then execute a command:

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

:bulb: Bangle will always export a higher order function which returns a command.

:book: Please read the Prosemirror [guide](https://prosemirror.net/docs/guide/#commands) on command for more details.
