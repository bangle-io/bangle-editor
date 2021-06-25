import React, { useState } from 'react';

export function MenuDropdown({
  className = '',
  parent,
  children,
}: {
  className?: string;
  children: React.ReactNode;
  parent: (arg: {
    isDropdownVisible: boolean;
    updateDropdown: (isDropdownVisible: boolean) => void;
  }) => React.ReactNode;
}) {
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
