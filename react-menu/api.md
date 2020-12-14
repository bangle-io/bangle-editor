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

1. `defaultMenu` Regular tooltip showing some basic formatting buttons.

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

  - `defaultMenu`: If the above do not match and selection is not empty.

  - `null` : anything else

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
  Return the type of floating menu to render based on the type. Defaults to using a function which returns some default components for the following types:

  - Some sensible default buttons for `'defaultMenu'`.

  - LinkSubMenu for `'linkSubMenu'`.

  - Hide the menu for `null`.

**Usage**

:book: See {{example.FloatingMenu}}

## Menu: {{global.link.ReactElement}}

A UI wrapper component for building a menu.

**Props:**

- **className**: ?string\
  Add classes to this component.

- **children:** React.Children

## MenuGroup: {{global.link.ReactElement}}

A UI wrapper for grouping menu buttons and showing a partition to separate from other Menu groups.

**Props:**

- **className**: ?string\
  Add classes to this component.

- **children:** React.Children

**Usage**
Building a menu

```jsx
import {
  Menu,
  MenuGroup,
  BoldButton,
  HeadingButton,
  BulletListButton,
  ItalicButton,
} from '@banglejs/react-menu';

<Menu>
  <MenuGroup>
    <BoldButton />
    <ItalicButton />
  </MenuGroup>
  <MenuGroup>
    <HeadingButton level={1} />
    <HeadingButton level={2} />
    <BulletListButton />
  </MenuGroup>
</Menu>
```

📖 See [FloatingMenu example](http://localhost:3000/docs/examples/react-floating-menu) for more details.

## MenuButton

### BoldButton: {{global.link.ReactElement}}

Marks text as `bold` mark.

### ItalicButton: {{global.link.ReactElement}}

Marks text as `italic` mark.

### CodeButton: {{global.link.ReactElement}}

Marks text as `code` mark.

### BulletListButton: {{global.link.ReactElement}}

Convert text to a `bulletList` node.

### TodoListButton: {{global.link.ReactElement}}

Convert text to a `todoList` node.

### HeadingButton: {{global.link.ReactElement}}

Convert text to a `heading` node.

**Props:**

- **level:** number\
  The heading level.

### LinkButton**:** {{global.link.ReactElement}}

Change the type of menu to `'linkSubMenu'` . 

**Props:**

- **menuKey**: {{Prosemirror.PluginKey}}\
  The menu key associated with your menu plugin.

## LinkSubMenu: {{global.link.ReactElement}}

A component for showing a link editor for the type `'linkSubMenu'`.