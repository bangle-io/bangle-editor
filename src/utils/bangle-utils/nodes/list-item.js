import { splitListItem, liftListItem, sinkListItem } from 'tiptap-commands';
import { findParentNodeOfType, canInsert, safeInsert } from 'prosemirror-utils';
import { Node } from './node';
import { NodeSelection, Selection, TextSelection } from 'prosemirror-state';

export class ListItem extends Node {
  get name() {
    return 'list_item';
  }

  get schema() {
    return {
      content: 'paragraph block*',
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
      'Enter': splitListItem(type),
      'Tab': sinkListItem(type),
      'Shift-Tab': liftListItem(type),
      'Alt-Shift-ArrowDown': moveList(type, true),
      'Alt-Shift-ArrowUp': moveList(type, false),
    };
  }
}

function moveList(type, down = true) {
  return (state, dispatch) => {
    const match = findParentNodeOfType(type)(state.selection);
    if (!match) {
      return dispatch(state.tr);
    }
    const copy = type.createChecked(
      match.node.attrs,
      match.node.content,
      match.node.marks,
    );

    const newPos = down ? match.pos + match.node.nodeSize : match.pos;
    const tr = safeInsert(copy, newPos)(state.tr);

    // const start = tr.doc.resolve(tr.mapping.map(match.pos));
    // const end = tr.doc.resolve(tr.mapping.map(newPos));
    // const sel = new TextSelection(tr.doc.resolve(1), tr.doc.resolve(1));
    // tr.setSelection(sel);
    return dispatch(tr);
  };
}
