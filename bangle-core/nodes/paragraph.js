import { setBlockType } from 'prosemirror-commands';
import { TextSelection } from 'prosemirror-state';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';
import browser from '../utils/browser';

export class Paragraph extends Node {
  get defaultOptions() {
    return {
      keys: {
        jumpToStartOfLine: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
        jumpToEndOfLine: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
      },
    };
  }
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
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, schema.nodes.doc);

    return {
      'Alt-ArrowUp': filter(isTopLevel, moveNode(type, 'UP')),
      'Alt-ArrowDown': filter(isTopLevel, moveNode(type, 'DOWN')),

      [this.options.keys.jumpToStartOfLine]: jumpToStartOfLine(type),
      [this.options.keys.jumpToEndOfLine]: jumpToEndOfLine(type),

      'Meta-c': filter(isTopLevel, copyEmptyCommand(type)),
      'Meta-x': filter(isTopLevel, cutEmptyCommand(type)),

      'Meta-Shift-Enter': filter(isTopLevel, insertEmpty(type, 'above')),
      'Meta-Enter': filter(isTopLevel, insertEmpty(type, 'below')),
    };
  }
}

function jumpToStartOfLine(type) {
  return (state, dispatch) => {
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    const { start } = current;
    dispatch(state.tr.setSelection(TextSelection.create(state.doc, start)));
    return true;
  };
}

function jumpToEndOfLine(type) {
  return (state, dispatch) => {
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    const { node, start } = current;
    dispatch(
      state.tr.setSelection(
        TextSelection.create(state.doc, start + node.content.size),
      ),
    );
  };
}
