import React from 'react';
import PropTypes from 'prop-types';

export function MenuItemButton({ active, enabled, onClick, label, iconType }) {
  const buttonLook = active ? 'is-light' : 'is-white';
  return (
    <button
      className={`button ${buttonLook}`}
      disabled={enabled ? '' : 'disabled'}
      onClick={onClick}
    >
      <span className={`icon has-text-grey-dark`}>
        <i className={`fas fa-${iconType}`} title={label} />
      </span>
    </button>
  );
}

MenuItemButton.propTypes = {
  active: PropTypes.bool.isRequired,
  enabled: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  iconType: PropTypes.string.isRequired
};
