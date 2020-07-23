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
      draggable: false,
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
      'Backspace': backspaceKeyCommand,
      'Enter': enterKeyCommand,
      'Tab': indentList(),
      'Shift-Tab': outdentList(),
      'Alt-Shift-ArrowDown': moveList(type, true),
      'Alt-Shift-ArrowUp': moveList(type, false),
      'Cmd-x': cutEmptyCommand(),
      'Cmd-c': copyEmptyCommand(),
    };
  }
}
