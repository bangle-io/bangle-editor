# menu

The menu module provides you with tools to help build flexible and powerful menu user interface.

### Installation

```
npm install @banglejs/react
```

# floatingMenu: Component

This is a bangle component which helps you create floating menus. By default it contains three types of tooltips:

1. `floatingMenu` The regular tooltip showing the basic formatting options.

2. `floatingLinkMenu` The link menu tooltip which allows editing and visiting of the link.

3. `null` No menu tooltip shown.

You add more types of tooltips by tweaking the `calculateType` parameter in the `.plugins({ ... })` .

```
import { floatingMenu } from '@banglejs/react-menu'
```

## plugins({ ... }): PluginFactory

Named parameters:

- **key:** ?PluginKey

- **keybindings:** ?Object = defaultKeys

- **getScrollContainer:** ?fn(view: EditorView) -> dom.Node\
  The dom Node which contains the scrollbar. This will be used to prevent the tooltip from overflowing.\
  _default:_ Uses the parent dom Node of the view.

- **calculateType:** ?fn(state: EditorState, prevType: string | null) -> string | null\
  A function to calculate the type of floating menu to show whenever the editor's selection changes. Note that this will _not_ be called if the type is changed via the `updateFloatingTooltipType` command. \
  _default_: Calculates the first of the following types whose conditions are matched.:

  - `floatingLinkMenu`: If the the selection is inside a link mark

  - `null` : If the above do not match and the selection is empty.

  - `floatingMenu`: If the above do not match.

## commands: CommandObject

- **focusFloatingMenuInput**(key: PluginKey): Command\
  Sets the focus on the `input` element in the floating menu. Ideally used to set the focus to `floatingLinkMenu`, which has an input element for updating the link.

- **toggleFloatingLinkMenu**(key: PluginKey): Command\
  Toggles the `floatingLinkMenu` tooltip.

- **updateFloatingTooltipType**(key: PluginKey, type: string | null): Command\
  Sets the floating menu's current type to `type` .Set type to `null` to hide the floating menu tooltip.

## defaultKeys: Keybindings

- **hide** = 'Escape'

- **toggleLink** = 'Meta-k'

```
import {ReactEditor} from '@banglejs/react';
import {floatingMenu} from '@banglejs/react-menu';

const menuKey = new PluginKey();
const plugins = [
  // otherPlugins
  floatingMenu.plugins({ key: menuKey })
]

<ReactEditor options={{ plugins }}>
  <FloatingMenu menuKey={menuKey} />
</ReactEditor>

// to hide the tooltip
updateFloatingTooltipType(menuKey, null)(state, dispatch, view)
// to toggle the link menu
toggleFloatingLinkMenu(menuKey)(state, dispatch, view)
```

# FloatingMenu: React.Element

## Props

- **menuKey**: The plugin key of the floatingMenu.

- **renderMenuType:** ?fn({ type, menuKey}) -> React.Element. \
  Return the type of floating menu to render based on the type.\
  _default:_ Returns `<Menu />` for the type `floatingMenu` , `<LinkMenu />` for `floatingLinkMenu` and `null` for anything else.

```js
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

<ReactEditor options={{ plugins }}>
  <FloatingMenu menuKey={menuKey} renderMenuType={renderMenuType}/>
</ReactEditor>
```

Helpful links:

- Building a floating menu
