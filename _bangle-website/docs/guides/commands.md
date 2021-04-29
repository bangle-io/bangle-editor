---
title: Commands
sidebar_label: Commands and Interactivty
---

Bangle uses the concept of [Commands](/docs/api/core#command) which is borrowed from [Prosemirror](https://prosemirror.net/docs/guide/#commands) to allow for making controlled changes to your editor.

In the example below we try out a [heading](/docs/api/core#heading-component) command.

```js
import { components } from '@bangle.dev/core';

const { heading } = components;
// Create a command for toggling heading of level 3
const command = heading.commands.toggleHeading(3);

// Execute the command
command(state, dispatch);
```

### Executing a command

To get access to `state, dispatch`, you can save the editor in your applications state management and access it like this:

```js
const editor =  new BangleEditor({ ... })
const view = editor.view
const state = view.state
const dispatch = view.dispatch

// dry run a command
const success = toggleBold()(view.state);
// execute the command
toggleBold()(state, dispatch);
```

:bulb: Bangle will always export a higher order function which returns a command.

:book: [API](/docs/api/core#command) docs for commands.

:book: Please read the Prosemirror [guide](https://prosemirror.net/docs/guide/#commands) on commands for more details.
