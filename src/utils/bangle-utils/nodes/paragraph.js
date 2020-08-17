import { setBlockType } from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter } from '../utils/pm-utils';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';

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
    const parentCheck = parentHasDirectParentOfType(type, schema.nodes.doc);

    return {
      'Alt-ArrowUp': filter(parentCheck, moveNode(type, 'UP')),
      'Alt-ArrowDown': filter(parentCheck, moveNode(type, 'DOWN')),
      'Cmd-c': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        copyEmptyCommand(type),
      ),
      'Cmd-x': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        cutEmptyCommand(type),
      ),
    };
  }
}
