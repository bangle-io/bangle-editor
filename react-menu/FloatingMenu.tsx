import { PluginKey } from '@bangle.dev/pm';
import { usePluginState } from '@bangle.dev/react';
import PropTypes from 'prop-types';
import React from 'react';
import reactDOM from 'react-dom';
import { LinkSubMenu } from './LinkSubMenu';
import { Menu } from './Menu';
import {
  BoldButton,
  BulletListButton,
  CodeButton,
  FloatingLinkButton,
  HeadingButton,
  ItalicButton,
  TodoListButton,
} from './MenuButtons';
import { MenuGroup } from './MenuGroup';

export function FloatingMenu({
  menuKey,
  renderMenuType = ({ type, menuKey }) => {
    if (type === 'defaultMenu') {
      return (
        <Menu>
          <MenuGroup>
            <BoldButton />
            <ItalicButton />
            <CodeButton />
            <FloatingLinkButton menuKey={menuKey} />
          </MenuGroup>
          <MenuGroup>
            <HeadingButton level={2} />
            <HeadingButton level={3} />
            <BulletListButton />
            <TodoListButton />
          </MenuGroup>
        </Menu>
      );
    }
    if (type === 'linkSubMenu') {
      return (
        <Menu>
          <LinkSubMenu />
        </Menu>
      );
    }
    return null;
  },
}: {
  menuKey: PluginKey;
  renderMenuType: (opts: {
    menuKey: PluginKey;
    type: string;
  }) => JSX.Element | null;
}) {
  const menuState = usePluginState(menuKey);
  const renderElement = renderMenuType({ type: menuState.type, menuKey });

  return renderElement
    ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM)
    : null;
}

FloatingMenu.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
  renderMenuType: PropTypes.func,
};
