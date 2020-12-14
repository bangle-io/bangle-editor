import React from 'react';

export function MenuGroup({ className = '', children }) {
  return <div className={`bangle-menu-group  ${className}`}>{children}</div>;
}
