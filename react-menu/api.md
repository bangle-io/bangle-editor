---
title: '@banglejs/react-menu'
sidebar_label: '@banglejs/react-menu'
packageName: '@banglejs/react-menu'
id: 'react_menu'
---

This package provides you with tools to help build flexible yet powerful menus using React.

### Installation

```
npm install @banglejs/react @banglejs/react-menu
```

## floatingMenu: {{core.link.Component}}

This is a component which helps you create floating menus. By default it contains three types of tooltips:

1. `floatingMenu` The regular tooltip showing the basic formatting options.

2. `floatingLinkMenu` The link menu tooltip which allows editing and visiting of the link.

3. `null` No menu tooltip shown.

You can add more types of tooltips by tweaking the `calculateType` parameter in the `.plugins({ ... })`.

### plugins({ ... }): {{core.link.Plugins}}

Named parameters:

- **key:** ?{{core.link.PluginKey}}

- {{core.text.pluginsParamKeybindings}}

- **getScrollContainer:** ?fn(view: EditorView) -> dom.Node\
  The dom Node which contains the scrollbar. This will be used to prevent the tooltip from overflowing.\
  _default:_ Uses the parent dom Node of the view.

- **calculateType:** ?fn(state: EditorState, prevType: string | null) -> string | null\
  A function to calculate the type of floating menu to show whenever the editor's selection changes. Note that this will _not_ be called if the type is changed via the `updateFloatingTooltipType` command. \
  _default_: Calculates the first of the following types whose conditions are matched.:

  - `floatingLinkMenu`: If the the selection is inside a link mark

  - `null` : If the above do not match and the selection is empty.

  - `floatingMenu`: If the above do not match.

### commands: {{core.link.CommandObject}}

- **focusFloatingMenuInput**(key: {{core.link.PluginKey}}): {{core.link.Command}}\
  Sets the focus on the `input` element in the floating menu. Bangle uses this internally to set focus on the input element when a user press keyboard shortcut to set a link.

- **toggleFloatingLinkMenu**(key: {{core.link.PluginKey}}): {{core.link.Command}}\
  Toggles the `floatingLinkMenu` tooltip.

- **updateFloatingTooltipType**(key: {{core.link.PluginKey}}, type: string | null): {{core.link.Command}}\
  Sets the floating menu's current type to `type`. Set type to `null` to hide the floating menu tooltip.

- **queryIsMenuActive**(key: {{core.link.PluginKey}}): {{typedQueryCommand "boolean"}}\
  Query if the menu is active.

### defaultKeys: {{core.link.Keybindings}}

- **hide** = `'Escape'`

- **toggleLink** = `'Meta-k'`

**Usage**

:bulb: Please read {{global.link.MenuGuide}} for a more detailed walkthrough.

```js
import {ReactEditor} from '@banglejs/react';
import {floatingMenu} from '@banglejs/react-menu';

const menuKey = new PluginKey('menuKey');
const plugins = [
  // otherPlugins
  floatingMenu.plugins({ key: menuKey })
]

<ReactEditor options=\{{ plugins }}>
  <FloatingMenu menuKey={menuKey} />
</ReactEditor>

// to hide the tooltip
updateFloatingTooltipType(menuKey, null)(state, dispatch, view)
// to toggle the link menu
toggleFloatingLinkMenu(menuKey)(state, dispatch, view)
```

## FloatingMenu: {{global.link.ReactElement}}

### Props

- **menuKey**: ?{{core.link.PluginKey}} \
  The plugin key of the floatingMenu.

- **renderMenuType:** ?fn({ type, menuKey }) -> [React.Element](https://reactjs.org/docs/react-api.html#reactcomponent)\
  Return the type of floating menu to render based on the type.\
  If no value is supplied, it will default to using `<Menu />` for the type `floatingMenu` , `<LinkMenu />` for `floatingLinkMenu` and `null` for everything else.

**Usage**

:bulb: Please read {{global.link.MenuGuide}} for a more detailed walkthrough.

```js
// customize the rendering behaviour for custom types
const renderMenuType = ({ type, menuKey }) => {
    if (type === 'fancyMenu') {
      return <FancyMenu menuKey={menuKey} />;
    }
    if (type === 'floatingMenu') {
      return <Menu menuKey={menuKey} />;
    }
    return null;
  },
});

<ReactEditor options=\{{ plugins }}>
  <FloatingMenu menuKey={menuKey} renderMenuType={renderMenuType}/>
</ReactEditor>
```
