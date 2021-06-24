import React from 'react';

export function MenuGroup({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={`bangle-menu-group  ${className}`}>{children}</div>;
}
