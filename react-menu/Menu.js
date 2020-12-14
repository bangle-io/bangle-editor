import React from 'react';

export function Menu({ className = '', children }) {
  return <div className={`bangle-menu ${className}`}>{children}</div>;
}
