import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';
import { keymap } from '../utils/keymap';
import { copyEmptyCommand, cutEmptyCommand, moveNode } from '../core-commands';
import { filter, findParentNodeOfType, insertEmpty } from '../utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleHeading,
  queryIsHeadingActive,
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
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
};

const name = 'heading';
const defaultLevels = [1, 2, 3, 4, 5, 6];
const getTypeFromSchema = (schema) => schema.nodes[name];
const parseLevel = (level) => {
  level = parseInt(level, 10);
  return Number.isNaN(level) ? undefined : level;
};
function specFactory({ levels = defaultLevels } = {}) {
  if (levels.some((r) => typeof r !== 'number')) {
    throw new Error('levels must be number');
  }

  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        level: {
          default: 1,
        },
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: levels.map((level) => {
        return {
          tag: `h${level}`,
          attrs: { level: parseLevel(level) },
        };
      }),
      toDOM: (node) => {
        return [`h${node.attrs.level}`, {}, 0];
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
          block: name,
          getAttrs: (tok) => {
            return { level: parseLevel(tok.tag.slice(1)) };
          },
        },
      },
    },
    options: {
      levels,
    },
  };
}

function pluginsFactory({
  markdownShortcut = true,
  keybindings = defaultKeys,
} = {}) {
  return ({ schema, specRegistry }) => {
    const { levels } = specRegistry.options[name];
    const type = getTypeFromSchema(schema);
    const isInHeading = (state) => findParentNodeOfType(type)(state.selection);
    const levelBindings = Object.fromEntries(
      levels.map((level) => [
        keybindings[`toH${level}`],
        setBlockType(type, { level }),
      ]),
    );
    return [
      keybindings &&
        keymap({
          ...levelBindings,
          [keybindings.moveUp]: moveNode(type, 'UP'),
          [keybindings.moveDown]: moveNode(type, 'DOWN'),

          [keybindings.emptyCopy]: copyEmptyCommand(type),
          [keybindings.emptyCut]: cutEmptyCommand(type),

          [keybindings.insertEmptyParaAbove]: filter(
            isInHeading,
            insertEmpty(schema.nodes.paragraph, 'above', false),
          ),
          [keybindings.insertEmptyParaBelow]: filter(
            isInHeading,
            insertEmpty(schema.nodes.paragraph, 'below', false),
          ),
        }),
      ...(markdownShortcut ? levels : []).map((level) =>
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

export function toggleHeading(level = 3) {
  return (state, dispatch, view) => {
    if (queryIsHeadingActive(level)(state)) {
      return setBlockType(state.schema.nodes.paragraph)(state, dispatch, view);
    }
    return setBlockType(state.schema.nodes[name], { level })(
      state,
      dispatch,
      view,
    );
  };
}

export function queryIsHeadingActive(level = 3) {
  return (state) => {
    const match = findParentNodeOfType(state.schema.nodes[name])(
      state.selection,
    );
    if (!match) {
      return false;
    }
    const { node } = match;
    return node.attrs.level === level;
  };
}
