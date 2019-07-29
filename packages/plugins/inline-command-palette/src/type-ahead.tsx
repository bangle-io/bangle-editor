import { EditorState, PluginKey } from 'prosemirror-state';
import { InputRule } from 'prosemirror-inputrules';
import { Schema, Mark as PMMark } from 'prosemirror-model';
import { inputRules } from 'prosemirror-inputrules';
import { Plugin } from 'prosemirror-state';

export const typeAheadPluginKey = new PluginKey('typeAheadPlugin');

import {
  InputRuleHandler,
  TypeAheadPluginState,
  TypeAheadHandler
} from './types';

export function inputRulePlugin(
  schema: Schema,
  typeAheads: TypeAheadHandler[]
): Plugin | undefined {
  const triggersRegex = typeAheads
    .map(t => t.customRegex || t.trigger)
    .join('|');

  if (!triggersRegex.length) {
    return;
  }

  const regex = new RegExp(
    `(^|[.!?\\s${leafNodeReplacementCharacter}])(${triggersRegex})$`
  );

  const typeAheadInputRule = createInputRule(regex, (state, match) => {
    const typeAheadState = (typeAheadPluginKey.getState(
      state
    ) as TypeAheadPluginState) || { isAllowed: true }; // TODO look into this plugin

    /**
     * Why using match 2 and 3?  Regex:
     * (allowed characters before trigger)(joined|triggers|(sub capture groups))
     *            match[1]                     match[2]          match[3] – optional
     */
    const trigger = match[3] || match[2];

    if (!typeAheadState.isAllowed || !trigger) {
      return null;
    }

    const mark = schema.mark('typeAheadQuery', { trigger });
    const { tr, selection } = state;
    const marks = selection.$from.marks();

    return tr.replaceSelectionWith(
      schema.text(trigger, [mark, ...marks]),
      false
    );
  });

  return inputRules({ rules: [typeAheadInputRule] });
}

export default inputRulePlugin;

// ProseMirror uses the Unicode Character 'OBJECT REPLACEMENT CHARACTER' (U+FFFC) as text representation for
// leaf nodes, i.e. nodes that don't have any content or text property (e.g. hardBreak, emoji, mention, rule)
// It was introduced because of https://github.com/ProseMirror/prosemirror/issues/262
// This can be used in an input rule regex to be able to include or exclude such nodes.
export const leafNodeReplacementCharacter = '\ufffc';

export type InputRuleWithHandler = InputRule & { handler: InputRuleHandler };

export function createInputRule(
  match: RegExp,
  handler: InputRuleHandler,
  isBlockNodeRule: boolean = false
): InputRuleWithHandler {
  return defaultInputRuleHandler(
    new InputRule(match, handler) as InputRuleWithHandler,
    isBlockNodeRule
  );
}

export function defaultInputRuleHandler(
  inputRule: InputRuleWithHandler,
  isBlockNodeRule: boolean = false
): InputRuleWithHandler {
  const originalHandler = (inputRule as any).handler;
  inputRule.handler = (state: EditorState, match, start, end) => {
    // Skip any input rule inside code
    const unsupportedMarks = isBlockNodeRule
      ? hasUnsupportedMarkForBlockInputRule(state, start, end)
      : hasUnsupportedMarkForInputRule(state, start, end);
    if (state.selection.$from.parent.type.spec.code || unsupportedMarks) {
      return;
    }
    return originalHandler(state, match, start, end);
  };
  return inputRule;
}

const hasUnsupportedMarkForBlockInputRule = (
  state: EditorState,
  start: number,
  end: number
) => {
  const {
    doc,
    schema: { marks }
  } = state;
  let unsupportedMarksPresent = false;
  const isUnsupportedMark = (node: PMMark) =>
    node.type === marks.code ||
    node.type === marks.link ||
    node.type === marks.typeAheadQuery;
  doc.nodesBetween(start, end, node => {
    unsupportedMarksPresent =
      unsupportedMarksPresent ||
      node.marks.filter(isUnsupportedMark).length > 0;
  });
  return unsupportedMarksPresent;
};

const hasUnsupportedMarkForInputRule = (
  state: EditorState,
  start: number,
  end: number
) => {
  const {
    doc,
    schema: { marks }
  } = state;
  let unsupportedMarksPresent = false;
  const isCodemark = (node: PMMark) =>
    node.type === marks.code || node.type === marks.typeAheadQuery;
  doc.nodesBetween(start, end, node => {
    unsupportedMarksPresent =
      unsupportedMarksPresent || node.marks.filter(isCodemark).length > 0;
  });
  return unsupportedMarksPresent;
};
