/**
 * whether the mark of type = `type` is active
 * @returns {Boolean}
 */
export function isMarkActive(editorState, type) {
  let { from, $from, to, empty } = editorState.selection;
  if (empty) {
    return Boolean(type.isInSet(editorState.storedMarks || $from.marks()));
  } else {
    return Boolean(editorState.doc.rangeHasMark(from, to, type));
  }
}
