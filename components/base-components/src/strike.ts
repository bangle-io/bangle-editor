import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import {
  Command,
  DOMOutputSpec,
  EditorState,
  keymap,
  Schema,
  toggleMark,
} from '@bangle.dev/pm';
import {
  isMarkActiveInSelection,
  markInputRule,
  markPasteRule,
  createObject,
} from '@bangle.dev/utils';

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

function specFactory(): RawSpecs {
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
          getAttrs: (value: any) => value === 'line-through' && null,
        },
      ],
      toDOM: (): DOMOutputSpec => ['s', 0],
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

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/(?:^|\s)((?:~~)((?:[^~]+))(?:~~))/g, type),
      markInputRule(/(?:^|\s)((?:~~)((?:[^~]+))(?:~~))$/, type),
      keybindings &&
        keymap(createObject([[keybindings.toggleStrike, toggleMark(type)]])),
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
