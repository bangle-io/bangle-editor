import { EditorState, InputRule, Mark, MarkType } from '@bangle.dev/pm';

function getMarksBetween(start: number, end: number, state: EditorState) {
  let marks: Array<{ start: number; end: number; mark: Mark }> = [];

  state.doc.nodesBetween(start, end, (node, pos) => {
    marks = [
      ...marks,
      ...node.marks.map((mark) => ({
        start: pos,
        end: pos + node.nodeSize,
        mark,
      })),
    ];
  });

  return marks;
}

export function markInputRule(regexp: RegExp, markType: MarkType): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const { tr } = state;
    const m = match.length - 1;
    let markEnd = end;
    let markStart = start;

    const matchMths = match[m];
    const firstMatch = match[0];
    const mathOneBeforeM = match[m - 1];

    if (matchMths != null && firstMatch != null && mathOneBeforeM != null) {
      const matchStart = start + firstMatch.indexOf(mathOneBeforeM);
      const matchEnd = matchStart + mathOneBeforeM.length - 1;
      const textStart = matchStart + mathOneBeforeM.lastIndexOf(matchMths);
      const textEnd = textStart + matchMths.length;

      const excludedMarks = getMarksBetween(start, end, state)
        .filter((item) => {
          return item.mark.type.excludes(markType);
        })
        .filter((item) => item.end > matchStart);

      if (excludedMarks.length) {
        return null;
      }

      if (textEnd < matchEnd) {
        tr.delete(textEnd, matchEnd);
      }
      if (textStart > matchStart) {
        tr.delete(matchStart, textStart);
      }
      markStart = matchStart;
      markEnd = markStart + matchMths.length;
    }

    tr.addMark(markStart, markEnd, markType.create());
    tr.removeStoredMark(markType);
    return tr;
  });
}
