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
  toggleUnderline,
  queryIsUnderlineActive,
};
export const defaultKeys = {
  toggleUnderline: 'Mod-u',
};

const name = 'underline';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

function specFactory() {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'u',
        },
        {
          style: 'text-decoration',
          getAttrs: (value: string) => value === name,
        },
      ],
      toDOM: () => ['u', 0],
    },
    markdown: {
      // TODO underline is not a real thing in markdown, what is the best option here?
      // I know this is cheating, but underlines are confusing
      // this moves them italic
      toMarkdown: {
        open: '_',
        close: '_',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markInputRule(/~([^~]+)~$/, type),
      markPasteRule(/~([^~]+)~/g, type),
      keybindings &&
        keymap({
          [keybindings.toggleUnderline]: toggleMark(type),
        }),
    ];
  };
}

export function toggleUnderline(): Command {
  return (state, dispatch, _view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch);
  };
}

export function queryIsUnderlineActive() {
  return (state: EditorState) => {
    return isMarkActiveInSelection(state.schema.marks[name])(state);
  };
}
