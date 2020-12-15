import React, { useState } from 'react';

export function MenuDropdown({ className = '', parent, children }) {
  const [isDropdownVisible, toggleDropdown] = useState(false);

  return (
    <div className={`bangle-menu-dropdown ${className}`}>
      {parent({ isDropdownVisible, toggleDropdown })}
      {isDropdownVisible ? (
        <div className="bangle-menu-vertical-group">{children}</div>
      ) : null}
    </div>
  );
}
