import {
  Command,
  EditorState,
  keymap,
  Schema,
  toggleMark,
} from '@bangle.dev/pm';
import { isMarkActiveInSelection } from '@bangle.dev/pm-utils';
import { markInputRule } from '../utils/mark-input-rule';
import { markPasteRule } from '../utils/mark-paste-rule';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleStrike,
  queryIsStrikeActive,
};
export const defaultKeys = {
  toggleStrike: 'Mod-d',
};

const name = 'strike';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

function specFactory() {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 's',
        },
        {
          tag: 'del',
        },
        {
          tag: 'strike',
        },
        {
          style: 'text-decoration',
          getAttrs: (value: string) => value === 'line-through',
        },
      ],
      toDOM: () => ['s', 0],
    },
    markdown: {
      toMarkdown: {
        open: '~~',
        close: '~~',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        s: { mark: 'strike' },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/~([^~]+)~/g, type),
      markInputRule(/~([^~]+)~$/, type),
      keybindings &&
        keymap({
          [keybindings.toggleStrike]: toggleMark(type),
        }),
    ];
  };
}

export function toggleStrike(): Command {
  return (state, dispatch, _view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch);
  };
}

export function queryIsStrikeActive() {
  return (state: EditorState) => {
    return isMarkActiveInSelection(state.schema.marks[name])(state);
  };
}
