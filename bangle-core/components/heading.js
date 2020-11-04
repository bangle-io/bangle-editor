import { toggleBlockType } from 'tiptap-commands';
import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { moveNode } from './list-item/commands';
import { filter, findParentNodeOfType, insertEmpty } from '../utils/pm-utils';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';
import { keymap } from 'bangle-core/utils/keymap';

const name = 'heading';

const getTypeFromSchema = (schema) => schema.nodes[name];

const defaultLevels = ['1', '2', '3', '4', '5', '6'];

export const spec = ({ levels = defaultLevels, classNames } = {}) => {
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
};

export const plugins = ({ levels = defaultLevels, keys = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const isInHeading = (state) => findParentNodeOfType(type)(state.selection);

    return [
      keymap(
        levels.reduce(
          (items, level) => ({
            ...items,
            ...{
              [`Shift-Ctrl-${level}`]: setBlockType(type, { level }),
            },
          }),
          {
            'Alt-ArrowUp': moveNode(type, 'UP'),
            'Alt-ArrowDown': moveNode(type, 'DOWN'),

            'Meta-c': copyEmptyCommand(type),
            'Meta-x': cutEmptyCommand(type),

            'Meta-Shift-Enter': filter(
              isInHeading,
              insertEmpty(schema.nodes.paragraph, 'above', false),
            ),
            'Meta-Enter': filter(
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
};

export const toggleHeading = ({ level = 3 } = {}) => {
  return (state, dispatch, view) =>
    toggleBlockType(state.schema.nodes.heading, state.schema.nodes.paragraph, {
      level,
    })(state, dispatch, view);
};

export const isSelectionInHeading = ({ level = 3 }) => {
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
};
