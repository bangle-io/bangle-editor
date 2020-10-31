import { markInputRule, markPasteRule } from 'tiptap-commands';
import { toggleMark } from 'prosemirror-commands';

import { Mark } from './mark';
import { isMarkActiveInSelection } from 'bangle-core/utils/pm-utils';

export class Italic extends Mark {
  get name() {
    return 'italic';
  }

  // get schema() {
  //   return {
  //     parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
  //     toDOM: () => ['em', 0],
  //   };
  // }

  // get markdown() {
  //   return {
  //     toMarkdown: {
  //       open: '_',
  //       close: '_',
  //       mixable: true,
  //       expelEnclosingWhitespace: true,
  //     },
  //     parseMarkdown: {
  //       em: { mark: 'italic' },
  //     },
  //   };
  // }

  // keys({ type }) {
  //   return {
  //     'Mod-i': toggleMark(type),
  //   };
  // }

  // commands({ type }) {
  //   return () => toggleMark(type);
  // }

  // inputRules({ type }) {
  //   return [
  //     markInputRule(/(?:^|[^_])(_([^_]+)_)$/, type),
  //     markInputRule(/(?:^|[^*])(\*([^*]+)\*)$/, type),
  //   ];
  // }

  // pasteRules({ type }) {
  //   return [
  //     markPasteRule(/_([^_]+)_/g, type),
  //     markPasteRule(/\*([^*]+)\*/g, type),
  //   ];
  // }
}
