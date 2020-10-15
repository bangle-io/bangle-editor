import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';

import { Mark } from './mark';

export class Code extends Mark {
  get name() {
    return 'code';
  }

  get schema() {
    return {
      excludes: '_',
      parseDOM: [{ tag: 'code' }],
      toDOM: () => ['code', 0],
    };
  }

  toMarkdown = () => {
    return {
      open(_state, _mark, parent, index) {
        return backticksFor(parent.child(index), -1);
      },
      close(_state, _mark, parent, index) {
        return backticksFor(parent.child(index - 1), 1);
      },
      escape: false,
    };
  };

  keys({ type }) {
    return {
      'Mod-`': toggleMark(type),
    };
  }

  commands({ type }) {
    return () => toggleMark(type);
  }

  inputRules({ type }) {
    return [markInputRule(/(?:`)([^`]+)(?:`)$/, type)];
  }

  pasteRules({ type }) {
    return [markPasteRule(/(?:`)([^`]+)(?:`)/g, type)];
  }
}

function backticksFor(node, side) {
  let ticks = /`+/g,
    m,
    len = 0;
  if (node.isText) {
    while ((m = ticks.exec(node.text))) {
      len = Math.max(len, m[0].length);
    }
  }
  let result = len > 0 && side > 0 ? ' `' : '`';
  for (let i = 0; i < len; i++) {
    result += '`';
  }
  if (len > 0 && side < 0) {
    result += ' ';
  }
  return result;
}
