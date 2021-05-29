import React, { useState } from 'react';

export function MenuDropdown({ className = '', parent, children }) {
  const [isDropdownVisible, updateDropdown] = useState(false);

  return (
    <div className={`bangle-menu-dropdown ${className}`}>
      {parent({
        isDropdownVisible,
        updateDropdown,
      })}
      {isDropdownVisible ? (
        <div className="bangle-menu-vertical-group">{children}</div>
      ) : null}
    </div>
  );
}
