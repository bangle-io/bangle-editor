import { setBlockType } from 'prosemirror-commands';
import { TextSelection } from 'prosemirror-state';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import { keymap } from '../utils/keymap';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
  moveNode,
  jumpToStartOfNode,
  jumpToEndOfNode,
} from '../core-commands';
import browser from '../utils/browser';

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
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
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
      toMarkdown(state, node) {
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
  return ({ schema }) => {
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
export function convertToParagraph() {
  return (state, dispatch) =>
    setBlockType(getTypeFromSchema(state.schema))(state, dispatch);
}

export function queryIsTopLevelParagraph() {
  return (state) => {
    const type = getTypeFromSchema(state.schema);
    return parentHasDirectParentOfType(type, state.schema.nodes.doc)(state);
  };
}

export function queryIsParagraph() {
  return (state) => {
    const type = getTypeFromSchema(state.schema);
    return Boolean(findParentNodeOfType(type)(state.selection));
  };
}

export function insertEmptyParagraphAbove() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return filter(
      parentHasDirectParentOfType(type, state.schema.nodes.doc),
      insertEmpty(type, 'above'),
    )(state, dispatch, view);
  };
}

export function insertEmptyParagraphBelow() {
  return (state, dispatch, view) => {
    const type = getTypeFromSchema(state.schema);
    return filter(
      parentHasDirectParentOfType(type, state.schema.nodes.doc),
      insertEmpty(type, 'below'),
    )(state, dispatch, view);
  };
}

export function jumpToStartOfParagraph() {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    return jumpToStartOfNode(type)(state, dispatch);
  };
}

export function jumpToEndOfParagraph() {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    return jumpToEndOfNode(type)(state, dispatch);
  };
}
