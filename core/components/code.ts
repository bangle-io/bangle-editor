import {
  Command,
  EditorState,
  keymap,
  MarkType,
  Node,
  Schema,
  Selection,
  TextSelection,
  toggleMark,
} from '@bangle.dev/pm';
import { filter, isMarkActiveInSelection } from '@bangle.dev/utils';
import { markInputRule } from '../utils/mark-input-rule';
import { markPasteRule } from '../utils/mark-paste-rule';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleCode,
  queryIsCodeActive,
};
export const defaultKeys = {
  toggleCode: 'Mod-`',
};

const name = 'code';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];
const getTypeFromState = (state: EditorState) => state.schema.marks[name];

function specFactory() {
  return {
    type: 'mark',
    name,
    schema: {
      excludes: '_', // means all marks are excluded
      parseDOM: [{ tag: name }],
      toDOM: () => [name, 0],
    },
    markdown: {
      toMarkdown: {
        open(_state: any, _mark: any, parent: Node, index: number) {
          return backticksFor(parent.child(index), -1);
        },
        close(_state: any, _mark: any, parent: Node, index: number) {
          return backticksFor(parent.child(index - 1), 1);
        },
        escape: false,
      },
      parseMarkdown: {
        code_inline: { mark: name, noCloseToken: true },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  escapeAtEdge = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    const escapeFilters = [
      // The $cursor is a safe way to check if it is a textSelection,
      // It is also used in a bunch of placed in pm-commands when dealing with marks
      // Ref: https://discuss.prosemirror.net/t/what-is-an-example-of-an-empty-selection-that-has-a-cursor/3071
      (state: EditorState) =>
        state.selection.empty && (state.selection as TextSelection).$cursor,
    ];

    return [
      markdownShortcut && markPasteRule(/(?:`)([^`]+)(?:`)/g, type),
      markdownShortcut && markInputRule(/(?:`)([^`]+)(?:`)$/, type),
      keybindings &&
        keymap({
          [keybindings.toggleCode]: toggleMark(type),
        }),

      escapeAtEdge &&
        keymap({
          ArrowRight: filter(escapeFilters, moveRight),
          ArrowLeft: filter(escapeFilters, moveLeft),
        }),
    ];
  };
}

const posHasCode = (state: EditorState, pos: number) => {
  // This logic exists because
  // in  rtl (right to left) $<code>text#</code>  (where $ and # represent possible cursor positions)
  // at the edges of code only $ and # are valid positions by default.
  // Put other ways, typing at $ cursor pos will not produce regular text,
  // and typing in # will produce code mark text.
  // To know if a pos will be inside code or not we check for a range.
  //    0      1   2   3   4   5   6        7
  // <para/>     a   b   c   d   e    </para>
  // if the mark is [bcd], and we are moving left from 6
  // we will need to check for rangeHasMark(4,5) to get that 5
  // is having a code mark, hence we do a `pos-1`
  // but if we are moving right and from 2, we donot need to add or subtract
  // because just doing rangeHasMark(2, 3) will give us correct answer.

  if (pos < 0 || pos > state.doc.content.size) {
    return false;
  }

  const code = getTypeFromState(state);
  const node = state.doc.nodeAt(pos);
  return node ? node.marks.some((mark) => mark.type === code) : false;
};

var moveRight: Command = (state, dispatch) => {
  const { code } = state.schema.marks;
  const $cursor = (state.selection as TextSelection).$cursor!;

  let storedMarks = state.tr.storedMarks;

  const insideCode = markActive(state, code);
  const currentPosHasCode = state.doc.rangeHasMark(
    $cursor.pos,
    $cursor.pos,
    code,
  );
  const nextPosHasCode = state.doc.rangeHasMark(
    $cursor.pos,
    $cursor.pos + 1,
    code,
  );

  const enteringCode =
    !currentPosHasCode &&
    nextPosHasCode &&
    !(storedMarks && storedMarks.length > 0);

  // entering code mark (from the left edge): don't move the cursor, just add the mark
  if (!insideCode && enteringCode) {
    if (dispatch) {
      dispatch(state.tr.addStoredMark(code.create()));
    }
    return true;
  }

  const exitingCode =
    !currentPosHasCode &&
    !nextPosHasCode &&
    !(storedMarks && storedMarks.length === 0);
  // exiting code mark: don't move the cursor, just remove the mark
  if (insideCode && exitingCode) {
    if (dispatch) {
      dispatch(state.tr.removeStoredMark(code));
    }
    return true;
  }

  return false;
};

var moveLeft: Command = (state, dispatch) => {
  const code = getTypeFromState(state);
  const insideCode = markActive(state, code);
  const $cursor = (state.selection as TextSelection).$cursor!;
  const { storedMarks } = state.tr;
  const currentPosHasCode = posHasCode(state, $cursor.pos);
  const nextPosHasCode = posHasCode(state, $cursor.pos - 1);
  const nextNextPosHasCode = posHasCode(state, $cursor.pos - 2);

  const exitingCode =
    currentPosHasCode && !nextPosHasCode && Array.isArray(storedMarks);
  const atLeftEdge =
    nextPosHasCode &&
    !nextNextPosHasCode &&
    (storedMarks === null ||
      (Array.isArray(storedMarks) && !!storedMarks.length));
  const atRightEdge =
    ((exitingCode && Array.isArray(storedMarks) && !storedMarks.length) ||
      (!exitingCode && storedMarks === null)) &&
    !nextPosHasCode &&
    nextNextPosHasCode;
  const enteringCode =
    !currentPosHasCode &&
    nextPosHasCode &&
    Array.isArray(storedMarks) &&
    !storedMarks.length;

  // at the right edge: remove code mark and move the cursor to the left
  if (!insideCode && atRightEdge) {
    const tr = state.tr.setSelection(
      Selection.near(state.doc.resolve($cursor.pos - 1)),
    );

    if (dispatch) {
      dispatch(tr.removeStoredMark(code));
    }
    return true;
  }

  // entering code mark (from right edge): don't move the cursor, just add the mark
  if (!insideCode && enteringCode) {
    if (dispatch) {
      dispatch(state.tr.addStoredMark(code.create()));
    }
    return true;
  }

  // at the left edge: add code mark and move the cursor to the left
  if (insideCode && atLeftEdge) {
    const tr = state.tr.setSelection(
      Selection.near(state.doc.resolve($cursor.pos - 1)),
    );

    if (dispatch) {
      dispatch(tr.addStoredMark(code.create()));
    }
    return true;
  }

  // exiting code mark (or at the beginning of the line): don't move the cursor, just remove the mark
  const isFirstChild = $cursor.index($cursor.depth - 1) === 0;
  if (insideCode && (exitingCode || (!$cursor.nodeBefore && isFirstChild))) {
    if (dispatch) {
      dispatch(state.tr.removeStoredMark(code));
    }
    return true;
  }

  return false;
};

function backticksFor(node: Node, side: number) {
  let ticks = /`+/g,
    m,
    len = 0;
  if (node.isText) {
    while ((m = ticks.exec(node.text!))) {
      len = Math.max(len, m[0].length);
    }
  }
  let result = len > 0 && side > 0 ? ' `' : '`';
  for (let i = 0; i < len; i++) {
    result += '`';
  }
  if (len > 0 && side < 0) {
    result += ' ';
  }
  return result;
}

function markActive(state: EditorState, mark: MarkType) {
  const { from, to, empty } = state.selection;
  // When the selection is empty, only the active marks apply.
  if (empty) {
    return !!mark.isInSet(
      state.tr.storedMarks || state.selection.$from.marks(),
    );
  }
  // For a non-collapsed selection, the marks on the nodes matter.
  let found = false;
  state.doc.nodesBetween(from, to, (node) => {
    found = found || !!mark.isInSet(node.marks);
  });
  return found;
}

export function toggleCode(): Command {
  return (state, dispatch) =>
    toggleMark(state.schema.marks[name])(state, dispatch);
}

export function queryIsCodeActive() {
  return (state: EditorState) =>
    isMarkActiveInSelection(state.schema.marks[name])(state);
}
