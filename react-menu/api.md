---
title: '@banglejs/react-menu'
sidebar_label: '@banglejs/react-menu'
packageName: '@banglejs/react-menu'
id: 'react_menu'
---

This package provides you with tools to help build flexible yet powerful menus using React.

### Installation

```
{{npmInstallation "@banglejs/react-menu"}}
```

## floatingMenu: {{core.link.Component}}

A component for creating menus that float somewhere in the editor, most likely around the selection. By default it contains three types of menus:

1. `floatingMenu` Regular tooltip showing the basic formatting options.

2. `linkSubMenu` The link menu tooltip which allows editing and visiting of the link.

3. `null` No menu tooltip shown.

See `calculateType` below for adding more types.

### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- **key:** ?{{Prosemirror.PluginKey}}

- {{core.text.pluginsParamKeybindings}}

- **getScrollContainer:** ?fn(view: EditorView) -> dom.Node\
  The dom Node which contains the scrollbar. This will be used to prevent the tooltip from overflowing. This defaults to using the parent dom Node of the {{Prosemirror.EditorView}}.

- **calculateType:** ?fn(state: EditorState, prevType: string | null) -> string | null\
  A function to calculate the type of floating menu to show whenever the editor's selection changes. Note that this will _not_ be called if the type is changed via the `updateFloatingTooltipType` command. The default value calculates the tooltip type based on the following conditions:

  - `linkSubMenu`: If the the selection is inside a link mark

  - `null` : If the above do not match and the selection is empty.

  - `floatingMenu`: If the above conditions do not match.

### commands: {{core.link.CommandObject}}

- **focusFloatingMenuInput**(key: {{Prosemirror.PluginKey}}): {{core.link.Command}}\
  Sets the focus on the `input` element in the floating menu. Bangle uses this internally to set focus on the input element when a user press keyboard shortcut to set a link.

- **toggleLinkSubMenu**(key: {{Prosemirror.PluginKey}}): {{core.link.Command}}\
  Toggles the `linkSubMenu` tooltip.

- **updateFloatingTooltipType**(key: {{Prosemirror.PluginKey}}, type: string | null): {{core.link.Command}}\
  Manually set the floating menu's current type. Set type to `null` to hide the floating menu tooltip.

- **queryIsMenuActive**(key: {{Prosemirror.PluginKey}}): {{typedQueryCommand "boolean"}}\
  Query if the menu is active.

### defaultKeys: {{core.link.Keybindings}}

- **hide** = `'Escape'`

- **toggleLink** = `'Meta-k'`

**Usage**

:book: See {{example.FloatingMenu}}

## FloatingMenu: {{global.link.ReactElement}}

### Props

- **menuKey**: ?{{Prosemirror.PluginKey}} \
  The plugin key of the floatingMenu.

- **renderMenuType:** ?fn({ type, menuKey }) -> [React.Element](https://reactjs.org/docs/react-api.html#reactcomponent)\
  Return the type of floating menu to render based on the type. Default to using:

  - `<Menu />` for the type `floatingMenu`

  - `<LinkMenu />` for `linkSubMenu`

  - `null` for everything else which essentially hides the menu.

**Usage**

:book: See {{example.FloatingMenu}}
