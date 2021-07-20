import {
  Command,
  DOMOutputSpec,
  EditorState,
  keymap,
  Node,
  Schema,
  wrapIn,
  wrappingInputRule,
} from '@bangle.dev/pm';
import { filter, findParentNodeOfType, insertEmpty } from '@bangle.dev/utils';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { RawPlugins } from '../utils/plugin-loader';
import { copyEmptyCommand, cutEmptyCommand, moveNode } from '../core-commands';
import { RawSpecs } from '../spec-registry';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  queryIsBlockquoteActive,
  wrapInBlockquote,
};
export const defaultKeys = {
  wrapIn: 'Ctrl-ArrowRight',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
};

const name = 'blockquote';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: [{ tag: 'blockquote' }],
      toDOM: (): DOMOutputSpec => {
        return ['blockquote', 0];
      },
    },
    markdown: {
      toMarkdown: (state: MarkdownSerializerState, node: Node) => {
        state.wrapBlock('> ', undefined, node, () => state.renderContent(node));
      },
      parseMarkdown: {
        blockquote: {
          block: name,
        },
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
      markdownShortcut && wrappingInputRule(/^\s*>\s$/, type),
      keybindings &&
        keymap({
          [keybindings.wrapIn]: wrapInBlockquote(),
          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),

          [keybindings.emptyCopy]: copyEmptyCommand(type),
          [keybindings.emptyCut]: cutEmptyCommand(type),

          [keybindings.insertEmptyParaAbove]: insertEmptyParaAbove(),
          [keybindings.insertEmptyParaBelow]: insertEmptyParaBelow(),
        }),
    ];
  };
}

export function queryIsBlockquoteActive() {
  return (state: EditorState) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}

export function wrapInBlockquote() {
  return filter(
    (state) => !queryIsBlockquoteActive()(state),
    (state, dispatch, _view) => {
      const type = getTypeFromSchema(state.schema);
      return wrapIn(type)(state, dispatch);
    },
  );
}

export function insertEmptyParaAbove(): Command {
  const isInBlockquote = queryIsBlockquoteActive();
  return (state, dispatch, view) => {
    return filter(
      isInBlockquote,
      insertEmpty(state.schema.nodes.paragraph, 'above', true),
    )(state, dispatch, view);
  };
}

export function insertEmptyParaBelow(): Command {
  const isInBlockquote = queryIsBlockquoteActive();
  return (state, dispatch, view) => {
    return filter(
      isInBlockquote,
      insertEmpty(state.schema.nodes.paragraph, 'below', true),
    )(state, dispatch, view);
  };
}
