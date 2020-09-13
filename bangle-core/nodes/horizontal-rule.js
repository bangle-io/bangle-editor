import { InputRule } from 'prosemirror-inputrules';

import { Node } from './node';

export class HorizontalRule extends Node {
  get name() {
    return 'horizontal_rule';
  }

  get schema() {
    return {
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM: () => ['hr'],
    };
  }

  commands({ type }) {
    return () => (state, dispatch) =>
      dispatch(state.tr.replaceSelectionWith(type.create()));
  }

  inputRules({ type }) {
    return new InputRule(
      /^(?:---|___\s|\*\*\*\s)$/,
      (state, match, start, end) => {
        if (!match[0]) {
          return false;
        }
        return state.tr.replaceWith(start - 1, end, type.create({}));
      },
    );
  }
}
