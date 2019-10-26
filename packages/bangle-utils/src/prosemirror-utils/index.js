/**
 * whether the mark of type is active
 * @returns {Boolean}
 */
export function isMarkActive(editorState, type) {
  const { from, $from, to, empty } = editorState.selection;
  if (empty) {
    return Boolean(type.isInSet(editorState.storedMarks || $from.marks()));
  }
  return Boolean(editorState.doc.rangeHasMark(from, to, type));
}
