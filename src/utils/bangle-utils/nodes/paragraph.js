import { setBlockType } from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';

export class Paragraph extends Node {
  get name() {
    return 'paragraph';
  }

  get schema() {
    return {
      content: 'inline*',
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'p',
        },
      ],
      toDOM: () => ['p', 0],
    };
  }

  commands({ type }) {
    return () => setBlockType(type);
  }

  keys({ type, schema }) {
    return {
      'Alt-ArrowUp': moveNode(type, schema.nodes.doc, 'UP'),
      'Alt-ArrowDown': moveNode(type, schema.nodes.doc, 'DOWN'),
    };
  }
}
