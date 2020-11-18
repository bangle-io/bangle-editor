import React, { useContext } from 'react';
import { EditorViewContext } from 'bangle-react/react-editor';
import { focusFloatingMenuInput, toggleLinkMenu } from './floating-menu';
import {
  boldItem,
  bulletListItem,
  codeItem,
  heading2Item,
  heading3Item,
  todoListItem,
  italicItem,
  linkItem,
} from './MenuIcons';

export function Menu({ menuKey }) {
  const view = useContext(EditorViewContext);

  const menuItems = [
    [
      boldItem(),
      italicItem(),
      linkItem(() => {
        toggleLinkMenu(menuKey)(view.state, view.dispatch, view);
        requestAnimationFrame(() =>
          focusFloatingMenuInput(menuKey)(view.state, view.dispatch, view),
        );
      }),
      codeItem(),
    ].filter(Boolean),
    [heading2Item(), heading3Item(), bulletListItem(), todoListItem()].filter(
      Boolean,
    ),
  ];

  return (
    <span className="bangle-menu">
      {menuItems.map((group, index, array) => {
        if (!Array.isArray(group)) {
          group = [group];
        }
        const leftBorder = index !== 0 ? 'left-border' : '';
        const rightBorder = index !== array.length - 1 ? 'right-border' : '';
        return (
          <span
            key={index}
            className={`bangle-menu-group ${leftBorder} ${rightBorder}`}
          >
            {group.map((item) => (
              <item.component
                isActive={
                  item.isActive &&
                  item.isActive(view.state, view.dispatch, view)
                }
                // TODO still passing view because toggleListCommand needs view
                // or it returns false
                isDisabled={!item.command(view.state, undefined, view)}
                hint={item.hint}
                key={item.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  item.command(view.state, view.dispatch, view);
                }}
              />
            ))}
          </span>
        );
      })}
    </span>
  );
}
