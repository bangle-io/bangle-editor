import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import {
  Command,
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
  toggleItalic,
  queryIsItalicActive,
};
export const defaultKeys = {
  toggleItalic: 'Mod-i',
};

const name = 'italic';

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
      parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
      toDOM: () => ['em', 0],
    },
    markdown: {
      toMarkdown: {
        open: '_',
        close: '_',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        em: { mark: name },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markPasteRule(/_([^_]+)_/g, type),
      markPasteRule(/\*([^*]+)\*/g, type),
      markInputRule(/(?:^|\s)((?:_)((?:[^_]+))(?:_))$/, type),
      markInputRule(/(?:^|\s)((?:\*)((?:[^*]+))(?:\*))$/, type),
      keybindings &&
        keymap(createObject([[keybindings.toggleItalic, toggleMark(type)]])),
    ];
  };
}

export function toggleItalic(): Command {
  return (state, dispatch, _view) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsItalicActive() {
  return (state: EditorState) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return isMarkActiveInSelection(markType)(state);
  };
}
