import React, { useState } from 'react';

export function MenuDropdown({ className = '', parent, children }) {
  const [isDropdownVisible, toggleDropdown] = useState(false);

  return (
    <div className={`bangle-menu-dropdown ${className}`}>
      {parent({ isDropdownVisible, toggleDropdown })}
      {isDropdownVisible ? children : null}
    </div>
  );
}

export function VerticalDropdownGroup({ children }) {
  return <div className="bangle-menu-dropdown-vertical-group">{children}</div>;
}
