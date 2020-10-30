import React from 'react';

export const Icon = ({
  children,
  onClick,
  style = {},
  className = '',
  isActive,
  isDisabled,
  hint,
  ...props
}) => (
  <button
    disabled={isDisabled}
    onClick={onClick}
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
