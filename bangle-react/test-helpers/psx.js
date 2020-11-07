import React from 'react';
import { psx as banglePsx } from 'bangle-core/test-helpers/index';

export function psx(name, ...args) {
  if (typeof name !== 'string') {
    return React.createElement(name, ...args);
  }
  if (name.startsWith('jsx_')) {
    return React.createElement(name.split('jsx_').join(''), ...args);
  }
  return banglePsx(name, ...args);
}
