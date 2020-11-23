import { Selection } from 'prosemirror-state';

export function setSelectionNear(view, pos) {
  let tr = view.state.tr;
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
}
