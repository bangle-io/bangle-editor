import { Node } from '../node';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  cutEmptyCommand,
  copyEmptyCommand,
  moveNode,
  isInsideListItem,
  moveEdgeListItem,
} from './commands';
import { filter } from '../../utils/pm-utils';
import { chainCommands } from 'prosemirror-commands';

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
    const move = (dir) =>
      chainCommands(
        moveNode(
          type,
          [schema.nodes['bullet_list'], schema.nodes['ordered_list']],
          dir,
        ),
        moveEdgeListItem(type, dir),
      );

    return {
      'Backspace': backspaceKeyCommand(type),
      'Tab': indentList(type),
      'Enter': enterKeyCommand(type),
      'Shift-Tab': outdentList(type),
      'Alt-ArrowUp': move('UP'),
      'Alt-ArrowDown': move('DOWN'),
      'Cmd-x': cutEmptyCommand(type),
      'Cmd-c': copyEmptyCommand(type),
    };
  }
}
