import React from 'react';
import PropTypes from 'prop-types';

export const MenuButton = ({
  className = '',
  children,
  isActive,
  isDisabled,
  hint,
  hintPos = 'top',
  hintBreakWhiteSpace = true,
  onMouseDown,
}) => {
  return (
    <button
      type="button"
      data-bangle-balloon-break={hintBreakWhiteSpace}
      aria-label={hint}
      data-bangle-balloon-pos={hintPos}
      disabled={isDisabled}
      onMouseDown={onMouseDown}
      className={`bangle-menu-button ${isActive ? 'active' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

MenuButton.propTypes = {
  onMouseDown: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
};
