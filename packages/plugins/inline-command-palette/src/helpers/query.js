import { isMarkActive } from 'bangle-utils/src/prosemirror-utils';

export function findQueryMark(mark, doc, from, to) {
  let queryMark = { start: -1, end: -1 };
  doc.nodesBetween(from, to, (node, pos) => {
    if (queryMark.start === -1 && mark.isInSet(node.marks)) {
      queryMark = {
        start: pos,
        end: pos + Math.max(node.textContent.length, 1),
      };
    }
  });

  return queryMark;
}

export function findTypeAheadQuery(state) {
  const { doc, schema } = state;
  const { typeAheadQuery } = schema.marks;
  const { from, to } = state.selection;
  const queryMark = findQueryMark(typeAheadQuery, doc, from - 1, to);
  if (queryMark.start === -1) {
    return;
  }
  return queryMark;
}

export function isTypeAheadQueryActive(editorState) {
  const { typeAheadQuery } = editorState.schema.marks;

  // TIP way to get if selection is empty or not
  // TODO-2 if the selection becomes too big (escape pressed) error throws in `typeAheadMark.attrs.trigger;`
  //        so this prevents that
  if (!editorState.selection.empty) {
    return false;
  }

  return isMarkActive(editorState, typeAheadQuery);
}

export function getTypeaheadQueryString(editorState) {
  const { nodeBefore } = editorState.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return '';
  }

  const { typeAheadQuery } = editorState.schema.marks;
  const typeAheadMark = typeAheadQuery.isInSet(nodeBefore.marks || []);
  const textContent = nodeBefore.textContent || '';
  const trigger = typeAheadMark.attrs.trigger;
  return (
    textContent
      // eslint-disable-next-line no-control-regex
      .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
      .replace(trigger, '')
  );
}
