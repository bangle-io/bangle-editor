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
import { safeInsert } from 'prosemirror-utils';
import { Selection } from 'prosemirror-state';

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
      'Meta-x': filter(parentCheck, cutEmptyCommand(type)),
      'Meta-c': filter(parentCheck, copyEmptyCommand(type)),
      'Meta-Shift-Enter': filter(parentCheck, insertEmpty(type, schema, 'UP')),
      'Ctrl-Enter': filter(parentCheck, insertEmpty(type, schema, 'DOWN')),
    };
  }
}

function insertEmpty(type, schema, direction) {
  const isUp = direction === 'UP';
  return (state, dispatch) => {
    const insertPos = isUp
      ? state.selection.$from.before(-1)
      : state.selection.$from.after(-1);

    const nodeToInsert = type.createChecked(
      {},
      schema.nodes.paragraph.createChecked({}),
    );

    const tr = state.tr;
    let newTr = safeInsert(nodeToInsert, insertPos)(state.tr);

    if (tr === newTr) {
      return false;
    }

    newTr = newTr.setSelection(Selection.near(newTr.doc.resolve(insertPos)));

    if (dispatch) {
      dispatch(newTr);
    }

    return true;
  };
}
