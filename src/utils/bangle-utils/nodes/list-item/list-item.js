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
      'Tab': indentList(),
      'Enter': enterKeyCommand,
      'Shift-Tab': outdentList(),
      'Alt-ArrowUp': moveList(type, false),
      'Alt-ArrowDown': moveList(type, true),
      'Cmd-x': cutEmptyCommand(),
      'Cmd-c': copyEmptyCommand(),
    };
  }
}
