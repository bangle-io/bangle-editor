import React from 'react';

export function Menu({
  className = '',
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bangle-menu ${className}`} {...props}>
      {children}
    </div>
  );
}
