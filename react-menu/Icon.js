import React, { useCallback } from 'react';

export const Icon = ({
  children,
  onSelect,
  style = {},
  className = '',
  isActive,
  isDisabled,
  hint,
  ...props
}) => {
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault();
      return onSelect();
    },
    [onSelect],
  );
  return (
    <button
      data-bangle-balloon-break
      aria-label={hint}
      data-bangle-balloon-pos="up"
      disabled={isDisabled}
      onMouseDown={onMouseDown}
      className={`inline-menu-icon ${isActive ? 'active' : ''}`}
    >
      <svg
        style={{ ...style }}
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
