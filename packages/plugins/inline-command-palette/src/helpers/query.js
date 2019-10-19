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
  return findQueryMark(typeAheadQuery, doc, from - 1, to);
}

export function isQueryActive(mark, doc, from, to) {
  let active = false;

  doc.nodesBetween(from, to, (node) => {
    if (!active && mark.isInSet(node.marks)) {
      active = true;
    }
  });

  return active;
}
