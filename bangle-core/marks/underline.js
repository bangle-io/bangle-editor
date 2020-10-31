import { toggleMark } from 'prosemirror-commands';

import { Mark } from './mark';

export class Underline extends Mark {
  get name() {
    return 'underline';
  }

  // get schema() {
  //   return {
  //     parseDOM: [
  //       {
  //         tag: 'u',
  //       },
  //       {
  //         style: 'text-decoration',
  //         getAttrs: (value) => value === 'underline',
  //       },
  //     ],
  //     toDOM: () => ['u', 0],
  //   };
  // }

  // get markdown() {
  //   // TODO underline is not a real thing in markdown, what is the best option here?
  //   // I know this is cheating, but underlines are confusing
  //   // this moves them italic
  //   return {
  //     toMarkdown: {
  //       open: '_',
  //       close: '_',
  //       mixable: true,
  //       expelEnclosingWhitespace: true,
  //     },
  //   };
  // }

  // keys({ type }) {
  //   return {
  //     'Mod-u': toggleMark(type),
  //   };
  // }

  // commands({ type }) {
  //   return () => toggleMark(type);
  // }
}
