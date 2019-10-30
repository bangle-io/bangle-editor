import { findParentNode, findSelectedNodeOfType } from 'prosemirror-utils';
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

// TODO document this, probably gets the attributes of the mark of the current selection
export default function getMarkAttrs(editorState, type) {
  const { from, to } = editorState.selection;
  let marks = [];

  editorState.doc.nodesBetween(from, to, (node) => {
    marks = [...marks, ...node.marks];
  });

  const mark = marks.find((markItem) => markItem.type.name === type.name);

  return mark ? mark.attrs : {};
}

export function nodeIsActive(editorState, type, attrs = {}) {
  const predicate = (node) => node.type === type;
  const node =
    findSelectedNodeOfType(type)(editorState.selection) ||
    findParentNode(predicate)(editorState.selection);

  if (!Object.keys(attrs).length || !node) {
    return !!node;
  }

  return node.node.hasMarkup(type, attrs);
}
