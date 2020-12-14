import React, { useCallback } from 'react';
import PropTypes from 'prop-types';

export const Icon = ({
  children,
  className = '',
  onSelect,
  style = {},
  isActive,
  isDisabled,
  hint,
  hintPos = 'top',
  hintBreakWhiteSpace = true,
  ...props
}) => {
  const onMouseDown = useCallback(
    (e) => {
      console.log('mouse down', e);
      e.preventDefault();
      return onSelect();
    },
    [onSelect],
  );
  return (
    <button
      data-bangle-balloon-break={hintBreakWhiteSpace}
      aria-label={hint}
      data-bangle-balloon-pos={hintPos}
      disabled={isDisabled}
      onMouseDown={onSelect ? onMouseDown : undefined}
      className={`inline-menu-icon ${isActive ? 'active' : ''}`}
    >
      <svg
        style={style}
        viewBox={'0 0 24 24'}
        xmlns="http://www.w3.org/2000/svg"
        className={`${className}`}
        {...props}
      >
        {children}
      </svg>
    </button>
  );
};

Icon.propTypes = {
  onSelect: PropTypes.func,
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.arrayOf(PropTypes.element),
  ]).isRequired,
};
