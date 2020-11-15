import React from 'react';
import reactDOM from 'react-dom';

import { PluginKey } from 'prosemirror-state';
import { pluginKeyStore } from 'bangle-plugins/helpers/utils';
import { isLinkMenuActive } from './link-menu';
import * as selectionTooltip from 'bangle-plugins/selection-tooltip/index';
import {
  boldItem,
  bulletListItem,
  codeItem,
  heading2Item,
  heading3Item,
  todoListItem,
  italicItem,
  linkItem,
} from './menu-item';

export const plugins = pluginsFactory;
export const commands = {
  hideFloatingMenuTooltip,
};

const keyStore = pluginKeyStore();

const getSelectionTooltipKey = (parentKey) => {
  return keyStore.get(parentKey, parentKey.key + '__selectionTooltip');
};
const createTooltipKey = (parentKey) => {
  return keyStore.create(parentKey, parentKey.key + '__selectionTooltip');
};

function pluginsFactory({
  key = new PluginKey('floating_menu'),
  getScrollContainerDOM = (view) => {
    return view.dom.parentElement;
  },
  linkMenuKey,
} = {}) {
  const { tooltipDOM, tooltipContent } = selectionTooltip.createTooltipDOM();
  const selectionTooltipKey = createTooltipKey(key);

  const menuItems = [
    [
      boldItem(),
      italicItem(),
      linkMenuKey && linkItem(linkMenuKey),
      codeItem(),
    ].filter(Boolean),
    [heading2Item(), heading3Item(), bulletListItem(), todoListItem()].filter(
      Boolean,
    ),
  ];

  const render = (state, dispatch, view) => {
    reactDOM.render(
      <Menu view={view}>
        {menuItems.map((group, index, array) => {
          if (!Array.isArray(group)) {
            group = [group];
          }
          const leftBorder = index !== 0 ? 'left-border' : '';
          const rightBorder = index !== array.length - 1 ? 'right-border' : '';
          return (
            <span
              key={index}
              className={`bangle-floating-menu-group ${leftBorder} ${rightBorder}`}
            >
              {group.map((item) => (
                <item.component
                  isActive={
                    item.isActive &&
                    item.isActive(view.state, view.dispatch, view)
                  }
                  // TODO still passing view because toggleListCommand needs view
                  // or it returns false
                  isDisabled={!item.command(state, undefined, view)}
                  hint={item.hint}
                  key={item.name}
                  onClick={(e) => {
                    e.preventDefault();
                    item.command(state, dispatch, view);
                  }}
                />
              ))}
            </span>
          );
        })}
      </Menu>,
      tooltipContent,
    );
    return true;
  };

  return selectionTooltip.plugins({
    key: selectionTooltipKey,
    tooltipName: 'floating_menu',
    tooltipDOM,
    getScrollContainerDOM,

    onHideTooltip: () => {
      reactDOM.unmountComponentAtNode(tooltipContent);
      return true;
    },

    onUpdateTooltip(state, dispatch, view) {
      const { head, from } = state.selection;
      if (this.popperInstance) {
        if (head === from) {
          // TODO move this as a command exposed by tooltipPlacement
          // and also expose it in floating-menu.js
          this.popperInstance.setOptions({ placement: 'top' });
        } else {
          this.popperInstance.setOptions({ placement: 'bottom' });
        }
      }
      console.log('rending');
      render(state, dispatch, view);
      return true;
    },

    shouldShowTooltip: (state) => {
      // TODO floating menu should not be responsible for checking other tooltips
      return !state.selection.empty && !isLinkMenuActive(linkMenuKey)(state);
    },
  });
}

class Menu extends React.PureComponent {
  render() {
    return <span className="bangle-floating-menu">{this.props.children}</span>;
  }
}

// Commands
export function hideFloatingMenuTooltip(key) {
  return selectionTooltip.hideSelectionTooltip(getSelectionTooltipKey(key));
}
