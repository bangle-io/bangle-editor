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

- **tooltipRenderOpts**: ?{{tooltip.link.tooltipRenderOpts}}

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
Building a menu:

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
</Menu>;
```

📖 See [FloatingMenu example](/docs/examples/react-floating-menu) for more details.

## LinkSubMenu: {{global.link.ReactElement}}

A React component for showing a link editor for the type `'linkSubMenu'`.

## MenuDropdown: {{global.link.ReactElement}}

A React component for rendering dropdowns.

**Props:**

- **parent:** fn({ isDropdownVisible, updateDropdown }) -> {{global.link.ReactElement}}\
  A render prop to show the button that allows toggling of the dropdown. Ideally you would wanna put in `MenuButton` in this.
- **children:** {{global.link.ReactElement}}\
  React children that are showed inside the dropdown. Ideally you would wanna put in `MenuButton`s in this.

📖 See [FloatingMenu example](/docs/examples/react-floating-menu) for a dropdown.

## MenuButton: {{global.link.ReactElement}}

A button for your menu.

**Props**:

- **className**: ?string\
  Add CSS classes to the `<button>` DOM node.
- **children**: ?{{global.link.ReactElement}}\
  The content of the button. Ideally some string or an SVG icon.
- **isActive**: ?boolean\
  Whether the button is active.
- **isDisabled**: ?boolean\
  Whether the button is disabled.
- **hint**: ?string\
  A tooltip hint to show when hover over this button.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **onMouseDown**: ?fn(event)\
  The mouse down handler of the button. You are expected to `event.preventDefault()` to prevent the editor from losing the focus.

## MenuButtons

Bangle comes with following button:

### BoldButton: {{global.link.ReactElement}}

Marks text as `bold` mark.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### ItalicButton: {{global.link.ReactElement}}

Marks text as `italic` mark.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### CodeButton: {{global.link.ReactElement}}

Marks text as `code` mark.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### BlockquoteButton: {{global.link.ReactElement}}

Wrap's inside a Blockquote.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### BulletListButton: {{global.link.ReactElement}}

Convert text to a `bulletList` node.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### TodoListButton: {{global.link.ReactElement}}

Convert text to a `todoList` node.

**Props:**

- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### HeadingButton: {{global.link.ReactElement}}

Convert text to a `heading` node.

**Props:**

- **level:** number\
  The heading level.
- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.

### FloatingLinkButton**:** {{global.link.ReactElement}}

Upon mouse down changes floating menu type to `'linkSubMenu'`. **Note:** this is meant to be used only inside [FloatingMenu](#floatingmenu-component).

**Props:**

- **menuKey**: {{Prosemirror.PluginKey}}\
  The menu key associated with your menu plugin.
- **hint**: ?string\
  A tooltip hint to show when hover over this button. Defaults to the name of the node and the keyboard shortcut. Set it to `null` to now show any hint.
- **hintPos**: ?`'top'`|`'bottom'`|`'right'`|`'left'`\
  The position of the hint tooltip.
- **children**: ?{{global.link.ReactElement}}\
  The content to render inside the button, but default it will render an Icon for the button.
