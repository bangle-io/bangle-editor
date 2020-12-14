import { toggleList } from './list-item/commands';
import { wrappingInputRule } from 'prosemirror-inputrules';

import { keymap } from 'prosemirror-keymap';
import { parentHasDirectParentOfType } from '@banglejs/core/core-commands';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-9',
};

const name = 'orderedList';
const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        order: {
          default: 1,
        },
      },
      content: 'listItem+',
      group: 'block',
      parseDOM: [
        {
          tag: 'ol',
          getAttrs: (dom) => ({
            order: dom.hasAttribute('start') ? +dom.getAttribute('start') : 1,
          }),
        },
      ],
      toDOM: (node) =>
        node.attrs.order === 1
          ? ['ol', 0]
          : ['ol', { start: node.attrs.order }, 0],
    },
    markdown: {
      toMarkdown(state, node) {
        let start = node.attrs.order || 1;
        let maxW = String(start + node.childCount - 1).length;
        let space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i) => {
          let nStr = String(start + i);
          return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
        });
      },
      parseMarkdown: {
        ordered_list: {
          block: name,
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      wrappingInputRule(
        /^(1)[\.\)] $/,
        type,
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1],
      ),
      keybindings &&
        keymap({
          [keybindings.toggle]: toggleList(type),
        }),
    ];
  };
}

export function toggleOrderedList() {
  return (state, dispatch, view) => {
    return toggleList(
      state.schema.nodes.orderedList,
      state.schema.nodes.listItem,
    )(state, dispatch, view);
  };
}

export function queryIsOrderedListActive() {
  return (state) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes[name],
    ])(state);
  };
}
