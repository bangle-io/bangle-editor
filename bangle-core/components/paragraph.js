import { setBlockType } from 'prosemirror-commands';
import { TextSelection } from 'prosemirror-state';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import { moveNode } from './list-item/commands';
import { keymap } from '../utils/keymap';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';
import browser from '../utils/browser';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  setParagraph: convertToParagraph,
  jumpToStartOfLine: jumpToStartOfParagraph,
  jumpToEndOfLine: jumpToEndOfParagraph,
};

export const defaultKeys = {
  jumpToEndOfLine: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
  jumpToStartOfLine: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Meta-c',
  emptyCut: 'Meta-x',
  insertEmptyAbove: 'Meta-Shift-Enter',
  insertEmptyBelow: 'Meta-Enter',
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

function pluginsFactory({ keys = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, schema.nodes.doc);
    return [
      keymap({
        [keys.moveUp]: filter(isTopLevel, moveNode(type, 'UP')),
        [keys.moveDown]: filter(isTopLevel, moveNode(type, 'DOWN')),

        [keys.jumpToStartOfLine]: jumpToStartOfParagraph(),
        [keys.jumpToEndOfLine]: jumpToEndOfParagraph(),

        [keys.emptyCopy]: filter(isTopLevel, copyEmptyCommand()),
        [keys.emptyCut]: filter(isTopLevel, cutEmptyCommand()),

        [keys.insertEmptyAbove]: filter(isTopLevel, insertEmpty(type, 'above')),
        [keys.insertEmptyBelow]: filter(isTopLevel, insertEmpty(type, 'below')),
      }),
    ];
  };
}

// Commands
export function convertToParagraph() {
  return (state, dispatch) =>
    setBlockType(getTypeFromSchema(state.schema))(state, dispatch);
}

export function jumpToStartOfParagraph() {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    const { start } = current;
    dispatch(state.tr.setSelection(TextSelection.create(state.doc, start)));
    return true;
  };
}

export function jumpToEndOfParagraph() {
  return (state, dispatch) => {
    const type = getTypeFromSchema(state.schema);
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    const { node, start } = current;
    dispatch(
      state.tr.setSelection(
        TextSelection.create(state.doc, start + node.content.size),
      ),
    );
    return true;
  };
}
