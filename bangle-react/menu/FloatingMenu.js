import React from 'react';
import reactDOM from 'react-dom';
import PropTypes from 'prop-types';
import { PluginKey } from 'bangle-core/index';

import { usePluginState } from '../use-plugin-state';
import { FloatingLinkMenu } from './FloatingLinkMenu';
import { Menu } from './Menu';

export function FloatingMenu({
  menuKey,
  renderMenuType = ({ type, menuKey }) => {
    if (type === 'floatingMenu') {
      return <Menu menuKey={menuKey} />;
    }
    if (type === 'floatingLinkMenu') {
      return <FloatingLinkMenu />;
    }
    return null;
  },
}) {
  const menuState = usePluginState(menuKey);
  const renderElement = renderMenuType({ type: menuState.type, menuKey });

  return renderElement
    ? reactDOM.createPortal(renderElement, menuState.tooltipContentDOM)
    : null;
}

FloatingMenu.propTypes = {
  menuKey: PropTypes.instanceOf(PluginKey).isRequired,
};
