import { EditorView, Selection } from '@bangle.dev/pm';

export function setSelectionNear(view: EditorView, pos: number) {
  let tr = view.state.tr;
  view.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos))));
}
