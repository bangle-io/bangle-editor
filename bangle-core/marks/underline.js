import { toggleMark } from 'prosemirror-commands';

import { Mark } from './mark';

export class Underline extends Mark {
  get name() {
    return 'underline';
  }

  get schema() {
    return {
      parseDOM: [
        {
          tag: 'u',
        },
        {
          style: 'text-decoration',
          getAttrs: (value) => value === 'underline',
        },
      ],
      toDOM: () => ['u', 0],

      toMarkdown: () => {
        return {
          open: '<ins>',
          close: '</ins>',
          mixable: true,
          expelEnclosingWhitespace: true,
        };
      },
    };
  }

  keys({ type }) {
    return {
      'Mod-u': toggleMark(type),
    };
  }

  commands({ type }) {
    return () => toggleMark(type);
  }
}
