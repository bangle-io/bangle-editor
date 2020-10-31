import React from 'react';
import PropTypes from 'prop-types';
import { BaseButton } from '../Button';

export function MenuBar({ getEditor }) {
  return (
    <div className="flex p-2 flex-row content-center justify-center bg-gray-200 rounded"></div>
  );
}

export function MenuItemButton({ active, enabled, onClick, label, iconType }) {
  return (
    <BaseButton
      onClick={onClick}
      isActive={active}
      faType={`fas fa-${iconType}`}
      disabled={!enabled}
      className="text-gray-900 hover:bg-gray-300 w-8 h-8"
      activeClassName="bg-gray-400"
    />
  );
}
MenuItemButton.propTypes = {
  active: PropTypes.bool,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconType: PropTypes.string.isRequired,
};
