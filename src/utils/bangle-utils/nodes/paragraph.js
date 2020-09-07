import { setBlockType } from 'tiptap-commands';
import { findParentNodeOfType } from 'prosemirror-utils';
import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter } from '../utils/pm-utils';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';
import { TextSelection } from 'prosemirror-state';
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
    // Enables certain command to only work if paragraph is direct child of `doc` node
    const parentCheck = parentHasDirectParentOfType(type, schema.nodes.doc);

    return {
      'Alt-ArrowUp': filter(parentCheck, moveNode(type, 'UP')),
      'Alt-ArrowDown': filter(parentCheck, moveNode(type, 'DOWN')),

      [this.options.keys.jumpToStartOfLine]: jumpToStartOfLine(type),
      [this.options.keys.jumpToEndOfLine]: jumpToEndOfLine(type),

      'Meta-c': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        copyEmptyCommand(type),
      ),
      'Meta-x': filter(
        // So that we donot interfere with nested p's in other nodes
        parentCheck,
        cutEmptyCommand(type),
      ),
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
    return true;
  };
}
