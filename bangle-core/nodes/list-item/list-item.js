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

const name = 'list_item';
const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
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
};

export const plugins = (opts = {}) => {
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
        'Backspace': backspaceKeyCommand(type),
        'Tab': indentList(type),
        'Enter': enterKeyCommand(type),
        'Shift-Tab': outdentList(type),
        'Alt-ArrowUp': filter(parentCheck, move('UP')),
        'Alt-ArrowDown': filter(parentCheck, move('DOWN')),
        'Meta-x': filter(parentCheck, cutEmptyCommand(type)),
        'Meta-c': filter(parentCheck, copyEmptyCommand(type)),
        'Meta-Shift-Enter': filter(
          parentCheck,
          insertEmpty(type, 'above', true),
        ),
        'Meta-Enter': filter(parentCheck, insertEmpty(type, 'below', true)),
      }),
    ];
  };
};
