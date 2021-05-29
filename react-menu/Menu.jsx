import React from 'react';

export function Menu({ className = '', children, ...props }) {
  return (
    <div className={`bangle-menu ${className}`} {...props}>
      {children}
    </div>
  );
}
