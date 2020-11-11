import { toggleBlockType } from 'tiptap-commands';
import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { moveNode } from './list-item/commands';
import { filter, findParentNodeOfType, insertEmpty } from '../utils/pm-utils';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { keymap } from 'bangle-core/utils/keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleHeading,
  isSelectionInHeading,
};
export const defaultKeys = {
  toH1: 'Shift-Ctrl-1',
  toH2: 'Shift-Ctrl-2',
  toH3: 'Shift-Ctrl-3',
  toH4: 'Shift-Ctrl-4',
  toH5: 'Shift-Ctrl-5',
  toH6: 'Shift-Ctrl-6',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyAbove: 'Mod-Shift-Enter',
  insertEmptyBelow: 'Mod-Enter',
};

const name = 'heading';
const defaultLevels = ['1', '2', '3', '4', '5', '6'];
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory({ levels = defaultLevels, classNames } = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        level: {
          default: '1',
        },
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: levels.map((level) => {
        return {
          tag: `h${level}`,
          attrs: { level },
        };
      }),
      toDOM: (node) => {
        return [
          `h${node.attrs.level}`,
          {
            class:
              classNames && classNames[`h${node.attrs.level}`]
                ? classNames[`h${node.attrs.level}`]
                : undefined,
          },
          0,
        ];
      },
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(state.repeat('#', node.attrs.level) + ' ');
        state.renderInline(node);
        state.closeBlock(node);
      },
      parseMarkdown: {
        heading: {
          block: 'heading',
          getAttrs: (tok) => ({ level: tok.tag.slice(1) }),
        },
      },
    },
  };
}

function pluginsFactory({
  levels = defaultLevels,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInHeading = (state) => findParentNodeOfType(type)(state.selection);

    return [
      keymap(
        levels.reduce(
          (items, level) => ({
            ...items,
            ...{
              [keybindings[`toH${level}`]]: setBlockType(type, { level }),
            },
          }),
          {
            [keybindings.moveUp]: moveNode(type, 'UP'),
            [keybindings.moveDown]: moveNode(type, 'DOWN'),

            [keybindings.emptyCopy]: copyEmptyCommand(type),
            [keybindings.emptyCut]: cutEmptyCommand(type),

            [keybindings.insertEmptyAbove]: filter(
              isInHeading,
              insertEmpty(schema.nodes.paragraph, 'above', false),
            ),
            [keybindings.insertEmptyBelow]: filter(
              isInHeading,
              insertEmpty(schema.nodes.paragraph, 'below', false),
            ),
          },
        ),
      ),
      ...levels.map((level) =>
        textblockTypeInputRule(
          new RegExp(`^(#{1,${level}})\\s$`),
          type,
          () => ({
            level,
          }),
        ),
      ),
    ];
  };
}

export function toggleHeading({ level = 3 } = {}) {
  return (state, dispatch, view) =>
    toggleBlockType(state.schema.nodes.heading, state.schema.nodes.paragraph, {
      level,
    })(state, dispatch, view);
}

export function isSelectionInHeading({ level = 3 }) {
  return (state) => {
    const match = findParentNodeOfType(state.schema.nodes.heading)(
      state.selection,
    );
    if (!match) {
      return false;
    }
    const { node } = match;
    return node.attrs.level === level;
  };
}
