import { setBlockType } from 'prosemirror-commands';
import { TextSelection } from 'prosemirror-state';
import { moveNode } from '../nodes/list-item/commands';
import { keymap } from 'prosemirror-keymap';
import { filter, insertEmpty, findParentNodeOfType } from '../utils/pm-utils';
import {
  parentHasDirectParentOfType,
  copyEmptyCommand,
  cutEmptyCommand,
} from '../core-commands';
import browser from '../utils/browser';

const name = 'paragraph';

const getType = (state) => state.schema.nodes[name];
const getTypeFromSchema = (schema) => schema.nodes[name];

export const defaultKeys = {
  jumpToStartOfLine: browser.mac ? 'Ctrl-a' : 'Ctrl-Home',
  jumpToEndOfLine: browser.mac ? 'Ctrl-e' : 'Ctrl-End',
};

export const spec = (opts = {}) => {
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
};

export const plugins = ({ keys = defaultKeys } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, schema.nodes.doc);
    return [
      keymap({
        'Alt-ArrowUp': filter(isTopLevel, moveNode(type, 'UP')),
        'Alt-ArrowDown': filter(isTopLevel, moveNode(type, 'DOWN')),

        [keys.jumpToStartOfLine]: jumpToStartOfLine(type),
        [keys.jumpToEndOfLine]: jumpToEndOfLine(type),

        'Meta-c': filter(isTopLevel, copyEmptyCommand(type)),
        'Meta-x': filter(isTopLevel, cutEmptyCommand(type)),

        'Meta-Shift-Enter': filter(isTopLevel, insertEmpty(type, 'above')),
        'Meta-Enter': filter(isTopLevel, insertEmpty(type, 'below')),
      }),
    ];
  };
};

export function setParagraph() {
  return (state, dispatch) => setBlockType(getType(state))(state, dispatch);
}

function jumpToStartOfLine(type) {
  return (state, dispatch) => {
    const current = findParentNodeOfType(type)(state.selection);
    if (!current) {
      return false;
    }
    const { start } = current;
    dispatch(state.tr.setSelection(TextSelection.create(state.doc, start)));
    return true;
  };
}

function jumpToEndOfLine(type) {
  return (state, dispatch) => {
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
  };
}
