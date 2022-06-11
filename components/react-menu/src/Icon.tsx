import PropTypes from 'prop-types';
import React from 'react';
import type { HintPos } from './types';

export interface MenuButtonProps {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  hint: string;
  hintPos?: HintPos;
  hintBreakWhiteSpace?: boolean;
  onMouseDown?: React.MouseEventHandler;
}

export const MenuButton = ({
  className = '',
  children,
  isActive,
  isDisabled,
  hint,
  hintPos = 'top',
  hintBreakWhiteSpace = true,
  onMouseDown,
}: MenuButtonProps) => {
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
