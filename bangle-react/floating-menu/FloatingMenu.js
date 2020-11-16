import React, { useCallback, useContext, useEffect } from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { PluginKey } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import {
  boldItem,
  bulletListItem,
  codeItem,
  heading2Item,
  heading3Item,
  todoListItem,
  italicItem,
} from '../inline-menu/menu-item';
import { usePluginState } from '../use-plugin-state';
import { EditorViewContext } from 'bangle-react/react-editor';

export function FloatingMenu(props) {
  const { menuKey } = props;
  const menuState = usePluginState([menuKey]);

  return (
    menuState.show &&
    reactDOM.createPortal(<Menu />, menuState.tooltipContentDOM)
  );
}

FloatingMenu.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};

function Menu() {
  const view = useContext(EditorViewContext);

  const menuItems = [
    [boldItem(), italicItem(), codeItem()].filter(Boolean),
    [heading2Item(), heading3Item(), bulletListItem(), todoListItem()].filter(
      Boolean,
    ),
  ];

  return (
    <span className="bangle-floating-menu">
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
                isDisabled={!item.command(view.state, undefined, view)}
                hint={item.hint}
                key={item.name}
                onMouseDown={(e) => {
                  e.preventDefault();
                  // e.preventDefault();
                  // e.stopPropagation();
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
