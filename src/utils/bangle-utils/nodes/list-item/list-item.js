import { Node } from '../node';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveList,
  cutEmptyCommand,
  copyEmptyCommand,
} from './commands';

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

  keys({ type }) {
    return {
      'Backspace': backspaceKeyCommand(type),
      'Tab': indentList(type),
      'Enter': enterKeyCommand(type),
      'Shift-Tab': outdentList(type),
      'Alt-ArrowUp': moveList(type, 'UP'),
      'Alt-ArrowDown': moveList(type, 'DOWN'),
      'Cmd-x': cutEmptyCommand(type),
      'Cmd-c': copyEmptyCommand(type),
    };
  }
}
