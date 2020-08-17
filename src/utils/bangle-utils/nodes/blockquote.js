import { wrappingInputRule, toggleWrap } from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';

export class Blockquote extends Node {
  get name() {
    return 'blockquote';
  }

  get schema() {
    return {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: () => ['blockquote', 0],
    };
  }

  commands({ type, schema }) {
    return () => toggleWrap(type, schema.nodes.paragraph);
  }

  keys({ type, schema }) {
    return {
      'Ctrl-ArrowRight': toggleWrap(type),
      'Alt-ArrowUp': moveNode(type, schema.nodes.doc, 'UP'),
      'Alt-ArrowDown': moveNode(type, schema.nodes.doc, 'DOWN'),
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*>\s$/, type)];
  }
}
