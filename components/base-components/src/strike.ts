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
  assertNotUndefined,
  createObject,
  isMarkActiveInSelection,
  markInputRule,
  markPasteRule,
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

const getTypeFromSchema = (schema: Schema) => {
  const markType = schema.marks[name];
  assertNotUndefined(markType, `markType ${name} not found`);
  return markType;
};
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
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsStrikeActive() {
  return (state: EditorState) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return isMarkActiveInSelection(markType)(state);
  };
}
