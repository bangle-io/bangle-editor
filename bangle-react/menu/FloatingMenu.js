import React from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { PluginKey } from 'prosemirror-state';

import { usePluginState } from '../use-plugin-state';
import { LinkMenu } from './FloatingLinkMenu';
import { Menu } from './Menu';

export function FloatingMenu({
  menuKey,
  renderMenuType = ({ type, menuKey }) => {
    if (type === 'floatingMenu') {
      return <Menu menuKey={menuKey} />;
    }
    if (type === 'floatingLinkMenu') {
      return <LinkMenu />;
    }
    return null;
  },
}) {
  const menuState = usePluginState([menuKey]);
  const renderElement = renderMenuType({ type: menuState.type, menuKey });

  return renderElement
    ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM)
    : null;
}

FloatingMenu.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};
