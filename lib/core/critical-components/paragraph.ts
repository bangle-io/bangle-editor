import type { RawPlugins } from '../plugin-loader';
import type { RawSpecs } from '../spec-registry';
import {
  Command,
  DOMOutputSpecArray,
  EditorState,
  keymap,
  Schema,
  setBlockType,
} from '@bangle.dev/pm';
import {
  browser,
  createObject,
  filter,
  findParentNodeOfType,
  insertEmpty,
} from '@bangle.dev/utils';
import {
  copyEmptyCommand,
  cutEmptyCommand,
  jumpToEndOfNode,
  jumpToStartOfNode,
  moveNode,
  parentHasDirectParentOfType,
} from '@bangle.dev/pm-commands';

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

function specFactory(): RawSpecs {
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
      toDOM: (): DOMOutputSpecArray => ['p', 0],
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

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    // Enables certain command to only work if paragraph is direct child of the `doc` node
    const isTopLevel = parentHasDirectParentOfType(type, schema.nodes.doc);
    return [
      keybindings &&
        keymap(
          createObject([
            [keybindings.convertToParagraph, convertToParagraph()],

            [keybindings.moveUp, filter(isTopLevel, moveNode(type, 'UP'))],
            [keybindings.moveDown, filter(isTopLevel, moveNode(type, 'DOWN'))],

            [keybindings.jumpToStartOfParagraph, jumpToStartOfNode(type)],
            [keybindings.jumpToEndOfParagraph, jumpToEndOfNode(type)],

            [keybindings.emptyCopy, filter(isTopLevel, copyEmptyCommand(type))],
            [keybindings.emptyCut, filter(isTopLevel, cutEmptyCommand(type))],

            [
              keybindings.insertEmptyParaAbove,
              filter(isTopLevel, insertEmpty(type, 'above')),
            ],
            [
              keybindings.insertEmptyParaBelow,
              filter(isTopLevel, insertEmpty(type, 'below')),
            ],
          ]),
        ),
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
