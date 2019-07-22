import React from 'react';
import { emojiLookup } from './constants';
import classnames from 'classnames';

export function Emoji({ attrs, selected }) {
  const type = attrs['data-type'];

  return React.createElement(
    'span',
    {
      className: classnames({
        'ProseMirror-selectednode': selected
      })
    },
    emojiLookup[type]
  );
}
