import React from 'react';

export function MenuGroup({ className = '', children, border = 'right' }) {
  return (
    <div className={`bangle-menu-group ${border}-border ${className}`}>
      {children}
    </div>
  );
}
