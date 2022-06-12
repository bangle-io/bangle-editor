import type { RawSpecs } from '@bangle.dev/core';
import {
  Command,
  DOMOutputSpec,
  EditorState,
  InputRule,
  keymap,
  Plugin,
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
  toggleUnderline,
  queryIsUnderlineActive,
};
export const defaultKeys = {
  toggleUnderline: 'Mod-u',
};

const name = 'underline';

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
          tag: 'u',
        },
        {
          style: 'text-decoration',
          getAttrs: (value: any) => value === name && null,
        },
      ],
      toDOM: (): DOMOutputSpec => ['u', 0],
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

function pluginsFactory({ keybindings = defaultKeys } = {}):
  | InputRule
  | Plugin
  | undefined {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markInputRule(/~([^~]+)~$/, type),
      markPasteRule(/~([^~]+)~/g, type),
      keybindings
        ? keymap(
            createObject([[keybindings.toggleUnderline, toggleMark(type)]]),
          )
        : undefined,
    ];
  };
}

export function toggleUnderline(): Command {
  return (state, dispatch, _view) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return toggleMark(markType)(state, dispatch);
  };
}

export function queryIsUnderlineActive() {
  return (state: EditorState) => {
    const markType = state.schema.marks[name];
    assertNotUndefined(markType, `markType ${name} not found`);

    return isMarkActiveInSelection(markType)(state);
  };
}
