import {
  Command,
  DOMOutputSpec,
  EditorState,
  keymap,
  Schema,
  toggleMark,
  Node,
} from '@bangle.dev/pm';
import { isMarkActiveInSelection } from '@bangle.dev/utils';
import { RawPlugins } from '../utils/plugin-loader';
import { markInputRule } from '../utils/mark-input-rule';
import { markPasteRule } from '../utils/mark-paste-rule';
import { RawSpecs } from '../spec-registry';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleBold,
  queryIsBoldActive,
};
export const defaultKeys = {
  toggleBold: 'Mod-b',
};

const name = 'bold';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

function specFactory(): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'strong',
        },
        {
          tag: 'b',
          // making node any type as there is some problem with pm-model types
          getAttrs: (node: any) => node.style.fontWeight !== 'normal' && null,
        },
        {
          style: 'font-weight',
          getAttrs: (value: any) =>
            /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null,
        },
      ],
      toDOM: (): DOMOutputSpec => ['strong', 0],
    },
    markdown: {
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true,
      },
      parseMarkdown: {
        strong: { mark: name },
      },
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markdownShortcut &&
        markPasteRule(/(?:\*\*|__)([^*_]+)(?:\*\*|__)/g, type),
      markdownShortcut &&
        markInputRule(/(?:\*\*|__)([^*_]+)(?:\*\*|__)$/, type),
      keybindings &&
        keymap({
          [keybindings.toggleBold]: toggleBold(),
        }),
    ];
  };
}

export function toggleBold(): Command {
  return (state, dispatch, _view) => {
    return toggleMark(state.schema.marks[name])(state, dispatch);
  };
}

export function queryIsBoldActive() {
  return (state: EditorState) =>
    isMarkActiveInSelection(state.schema.marks[name])(state);
}
