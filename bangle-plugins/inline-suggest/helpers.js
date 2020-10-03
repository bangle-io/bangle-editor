import { toggleMark } from 'prosemirror-commands';

const LOG = true;
let log = LOG
  ? console.log.bind(console, 'plugins/inline-command/helpers')
  : () => {};

export function isMarkTypeAllowedInSelection(markType, state) {
  if (!toggleMark(markType)(state)) {
    return false;
  }

  const { empty, $cursor, ranges } = state.selection;
  if (empty && !$cursor) {
    return false;
  }

  let isCompatibleMarkType = (mark) =>
    !mark.type.excludes(markType) && !markType.excludes(mark.type);

  if (
    state.tr.storedMarks &&
    !state.tr.storedMarks.every(isCompatibleMarkType)
  ) {
    return false;
  }

  if ($cursor) {
    return $cursor.marks().every(isCompatibleMarkType);
  }

  return ranges.every(({ $from, $to }) => {
    let allowedInActiveMarks =
      $from.depth === 0 ? state.doc.marks.every(isCompatibleMarkType) : true;

    state.doc.nodesBetween($from.pos, $to.pos, (node) => {
      allowedInActiveMarks =
        allowedInActiveMarks && node.marks.every(isCompatibleMarkType);
    });

    return allowedInActiveMarks;
  });
}

export function doesQueryHaveTrigger(state, markType, trigger) {
  const { nodeBefore } = state.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return false;
  }

  const typeAheadMark = markType.isInSet(nodeBefore.marks || []);

  // typeAheadMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!typeAheadMark) {
    return false;
  }

  const textContent = nodeBefore.textContent || '';

  return textContent.includes(trigger);
}

export function getQueryText(editorState, markType, trigger) {
  const { nodeBefore } = editorState.selection.$from;

  // nodeBefore in a new line (a new paragraph) is null
  if (!nodeBefore) {
    return '';
  }

  const typeAheadMark = markType.isInSet(nodeBefore.marks || []);

  // typeAheadMark is undefined if you delete the trigger while keeping rest of the query alive
  if (!typeAheadMark) {
    return '';
  }

  const textContent = nodeBefore.textContent || '';
  return (
    textContent
      // eslint-disable-next-line no-control-regex
      .replace(/^([^\x00-\xFF]|[\s\n])+/g, '')
      .replace(trigger, '')
  );
}
