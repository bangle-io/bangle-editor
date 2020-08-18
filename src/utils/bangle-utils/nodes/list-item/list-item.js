import { Node } from '../node';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveNode,
  moveEdgeListItem,
} from './commands';
import { filter } from '../../utils/pm-utils';
import { chainCommands } from 'prosemirror-commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
} from '../../core-commands';

export class ListItem extends Node {
  get name() {
    return 'list_item';
  }

  get schema() {
    return {
      content: '(paragraph) (paragraph | bullet_list | ordered_list)*',
      defining: true,
      draggable: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0],
    };
  }

  commands({ type }) {
    return () => (state, dispatch) => {
      dispatch(state.tr);
    };
  }

  keys({ type, schema }) {
    const parentCheck = parentHasDirectParentOfType(type, [
      schema.nodes['bullet_list'],
      schema.nodes['ordered_list'],
    ]);

    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    return {
      'Backspace': backspaceKeyCommand(type),
      'Tab': indentList(type),
      'Enter': enterKeyCommand(type),
      'Shift-Tab': outdentList(type),
      'Alt-ArrowUp': filter(parentCheck, move('UP')),
      'Alt-ArrowDown': filter(parentCheck, move('DOWN')),
      'Cmd-x': filter(parentCheck, cutEmptyCommand(type)),
      'Cmd-c': filter(parentCheck, copyEmptyCommand(type)),
    };
  }
}
