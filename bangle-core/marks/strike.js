import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';

import { Mark } from './mark';

export class Strike extends Mark {
  get name() {
    return 'strike';
  }

  get schema() {
    return {
      parseDOM: [
        {
          tag: 's',
        },
        {
          tag: 'del',
        },
        {
          tag: 'strike',
        },
        {
          style: 'text-decoration',
          getAttrs: (value) => value === 'line-through',
        },
      ],
      toDOM: () => ['s', 0],
    };
  }

  toMarkdown = () => {
    return {
      open: '~~',
      close: '~~',
      mixable: true,
      expelEnclosingWhitespace: true,
    };
  };

  keys({ type }) {
    return {
      'Mod-d': toggleMark(type),
    };
  }

  commands({ type }) {
    return () => toggleMark(type);
  }

  inputRules({ type }) {
    return [markInputRule(/~([^~]+)~$/, type)];
  }

  pasteRules({ type }) {
    return [markPasteRule(/~([^~]+)~/g, type)];
  }
}
