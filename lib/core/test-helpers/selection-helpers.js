import { Selection } from '@bangle.dev/pm';

export function setSelectionNear(view, pos) {
  let tr = view.state.tr;
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
}
