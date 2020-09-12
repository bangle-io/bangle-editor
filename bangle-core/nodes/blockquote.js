import { wrappingInputRule } from 'prosemirror-inputrules';

import { toggleWrap } from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { insertEmpty, filter, findParentNodeOfType } from '../utils/pm-utils';

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
    const isInBlockquote = (state) =>
      findParentNodeOfType(type)(state.selection);

    return {
      'Ctrl-ArrowRight': toggleWrap(type),
      'Alt-ArrowUp': moveNode(type, 'UP'),
      'Alt-ArrowDown': moveNode(type, 'DOWN'),

      'Meta-c': copyEmptyCommand(type),
      'Meta-x': cutEmptyCommand(type),

      'Meta-Shift-Enter': filter(
        isInBlockquote,
        insertEmpty(schema.nodes.paragraph, 'above', true),
      ),
      'Meta-Enter': filter(
        isInBlockquote,
        insertEmpty(schema.nodes.paragraph, 'below', true),
      ),
    };
  }

  inputRules({ type }) {
    return [wrappingInputRule(/^\s*>\s$/, type)];
  }
}
