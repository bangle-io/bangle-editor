import { Command, setBlockType } from 'prosemirror-commands';
import { Node, Schema } from 'prosemirror-model';
import {
  filter,
  insertEmpty,
  findParentNodeOfType,
} from '@bangle.dev/pm-utils';
import { keymap } from 'prosemirror-keymap';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
  moveNode,
  jumpToStartOfNode,
  jumpToEndOfNode,
} from '../core-commands';
import browser from '../utils/browser';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import { EditorState } from 'prosemirror-state';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  convertToParagraph,
  jumpToStartOfParagraph,
  jumpToEndOfParagraph,
  queryIsParagraph,
  queryIsTopLevelParagraph,
  insertEmptyParagraphAbove,
  insertEmptyParagraphBelow,
};

export const defaultKeys = {
  jumpToEndOfParagraph: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
  jumpToStartOfParagraph: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
  convertToParagraph: 'Ctrl-Shift-0',
};

const name = 'paragraph';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory() {
  return {
    type: 'node',
    name,
    schema: {
      content: 'inline*',
      group: 'block',
      draggable: false,
      parseDOM: [
        {
          tag: 'p',
        },
      ],
      toDOM: () => ['p', 0],
    },
    markdown: {
      toMarkdown(state: MarkdownSerializerState, node: Node) {
        state.renderInline(node);
        state.closeBlock(node);
      },
      parseMarkdown: {
        paragraph: {
          block: 'paragraph',
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }: { schema: Schema }) => {
    const type = getTypeFromSchema(schema);
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, schema.nodes.doc);
    return [
      keybindings &&
        keymap({
          [keybindings.convertToParagraph]: convertToParagraph(),

          [keybindings.moveUp]: filter(isTopLevel, moveNode(type, 'UP')),
          [keybindings.moveDown]: filter(isTopLevel, moveNode(type, 'DOWN')),

          [keybindings.jumpToStartOfParagraph]: jumpToStartOfNode(type),
          [keybindings.jumpToEndOfParagraph]: jumpToEndOfNode(type),

          [keybindings.emptyCopy]: filter(isTopLevel, copyEmptyCommand(type)),
          [keybindings.emptyCut]: filter(isTopLevel, cutEmptyCommand(type)),

          [keybindings.insertEmptyParaAbove]: filter(
            isTopLevel,
            insertEmpty(type, 'above'),
          ),
          [keybindings.insertEmptyParaBelow]: filter(
            isTopLevel,
            insertEmpty(type, 'below'),
          ),
        }),
    ];
  };
}

// Commands
export function convertToParagraph(): Command {
  return (state, dispatch) =>
    setBlockType(getTypeFromSchema(state.schema))(state, dispatch);
}

export function queryIsTopLevelParagraph() {
  return (state: EditorState) => {
    const type = getTypeFromSchema(state.schema);
    return parentHasDirectParentOfType(type, state.schema.nodes.doc)(state);
  };
}

export function queryIsParagraph() {
  return (state: EditorState) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}

export function insertEmptyParagraphAbove(): Command {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return filter(
      parentHasDirectParentOfType(type, state.schema.nodes.doc),
      insertEmpty(type, 'above'),
    )(state, dispatch, view);
  };
}

export function insertEmptyParagraphBelow(): Command {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return filter(
      parentHasDirectParentOfType(type, state.schema.nodes.doc),
      insertEmpty(type, 'below'),
    )(state, dispatch, view);
  };
}

export function jumpToStartOfParagraph(): Command {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    return jumpToStartOfNode(type)(state, dispatch);
  };
}

export function jumpToEndOfParagraph(): Command {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    return jumpToEndOfNode(type)(state, dispatch);
  };
}
