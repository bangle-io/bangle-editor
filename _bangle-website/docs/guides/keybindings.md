---
title: Keybindings
sidebar_label: Keybindings
---

Every Bangle components that support keybindings will

- accept a `keybindings` named parameter in its `plugins()` method.
- export `defaultKeys` object to get access to all the default keys.

In the example below we look at how to customize a keybindings for the
[bold](/docs/api/core#bold-component) component.

```js
import { bold } from '@bangle.dev/core';

// If you pass nothing the `bold.defaultKeys` keybindings will be used
bold.plugins();

// To override the toggleBold
bold.plugins({
  keybindings: {
    toggleBold: 'Ctrl-d',
  },
});

// To disable
bold.plugins({
  keybindings: {
    toggleBold: null,
  },
});

// Selectively modify one key
bold.plugins({
  keybindings: {
    ...bold.defaultKeys,
    toggleBold: 'Ctrl-d',
  },
});
```

### Adding custom keybindings

If you want to create your own keyboard sorcery you will need to use [Prosemirror.Keymap](https://prosemirror.net/docs/ref/#keymap). Let us create
a `Ctrl-s` shortcut which shouts the text content whenever pressed.

```js
import { keymap } from '@bangle.dev/core/utils/keymap';
import { corePlugins, coreSpec } from '@bangle.dev/core/utils/core-components';

const state = new BangleEditorState({
  plugins: () => [
    keymap({
      'Ctrl-s': (state, dispatch, view) => {
        alert(state.doc.textContent);
      },
    }),
    corePlugins(),
  ],
});
```

- The docs at [Prosemirror.Keymap](https://prosemirror.net/docs/ref/#keymap) go deeper into syntax.

- The nomenclature for key names is provided by [w3c-keyname](https://github.com/marijnh/w3c-keyname).

- If there are competing keybindings, the one that is defined first wins.

- Since keymap accepts a {[string]: [Command](/docs/api/core#command)} all the commands logic apply, for example, you
  can return an early `false` to avoid handling the key event.
