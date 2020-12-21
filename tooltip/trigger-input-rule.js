import { InputRule } from '@bangle.dev/core/prosemirror/inputrules';

// ProseMirror uses the Unicode Character 'OBJECT REPLACEMENT CHARACTER' (U+FFFC) as text representation for
// leaf nodes, i.e. nodes that don't have any content or text property (e.g. hardBreak, emoji)
// It was introduced because of https://github.com/ProseMirror/prosemirror/issues/262
// This can be used in an input rule regex to be able to include or exclude such nodes.
const leafNodeReplacementCharacter = '\ufffc';

export function triggerInputRule(schema, markName, trigger) {
  const regexStart = new RegExp(
    `(^|[.!?\\s${leafNodeReplacementCharacter}])(${trigger})$`,
  );

  const startRule = new InputRule(regexStart, (editorState, match) => {
    /**
     * Why using match 2 and 3?  Regex:
     * (allowed characters before trigger)(joined|triggers|(sub capture groups))
     *            match[1]                     match[2]          match[3] – optional
     */
    const trigger = match[3] || match[2];
    if (!trigger) {
      return;
    }
    const mark = schema.mark(markName, { trigger });
    const { tr, selection } = editorState;
    const marks = selection.$from.marks(); // selection would tell the cursor position, in this case from == to as no selection
    return tr.replaceSelectionWith(
      schema.text(trigger, [mark, ...marks]),
      false,
    );
  });

  return startRule;
}
