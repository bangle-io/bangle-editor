import { chainCommands } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';
import {
  indentList,
  backspaceKeyCommand,
  enterKeyCommand,
  outdentList,
  moveNode,
  moveEdgeListItem,
} from './commands';
import {
  cutEmptyCommand,
  copyEmptyCommand,
  parentHasDirectParentOfType,
} from '../../core-commands';
import { filter, insertEmpty } from '../../utils/pm-utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};
export const defaultKeys = {
  indent: 'Tab',
  outdent: 'Shift-Tab',
  moveDown: 'Alt-ArrowDown',
  moveUp: 'Alt-ArrowUp',
  emptyCopy: 'Mod-c',
  emptyCut: 'Mod-x',
  insertEmptyParaAbove: 'Mod-Shift-Enter',
  insertEmptyParaBelow: 'Mod-Enter',
};

const name = 'list_item';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      content: '(paragraph) (paragraph | bullet_list | ordered_list)*',
      defining: true,
      draggable: true,
      parseDOM: [{ tag: 'li' }],
      toDOM: () => ['li', 0],
    },
    markdown: {
      toMarkdown(state, node) {
        state.renderContent(node);
      },
      parseMarkdown: {
        list_item: { block: name },
      },
    },
  };
}

function pluginsFactory(opts = {}, keybindings = defaultKeys) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const parentCheck = parentHasDirectParentOfType(type, [
      schema.nodes['bullet_list'],
      schema.nodes['ordered_list'],
    ]);

    const move = (dir) =>
      chainCommands(moveNode(type, dir), moveEdgeListItem(type, dir));

    return [
      keymap({
        Backspace: backspaceKeyCommand(type),
        Enter: enterKeyCommand(type),
        [keybindings.indent]: indentList(type),
        [keybindings.outdent]: outdentList(type),
        [keybindings.moveUp]: filter(parentCheck, move('UP')),
        [keybindings.moveDown]: filter(parentCheck, move('DOWN')),
        [keybindings.emptyCut]: filter(parentCheck, cutEmptyCommand(type)),
        [keybindings.emptyCopy]: filter(parentCheck, copyEmptyCommand(type)),
        [keybindings.insertEmptyParaAbove]: filter(
          parentCheck,
          insertEmpty(type, 'above', true),
        ),
        [keybindings.insertEmptyParaBelow]: filter(
          parentCheck,
          insertEmpty(type, 'below', true),
        ),
      }),
    ];
  };
}
