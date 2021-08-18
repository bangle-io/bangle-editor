import type { RawPlugins, RawSpecs } from '@bangle.dev/core';
import {
  Command,
  EditorState,
  keymap,
  Schema,
  wrappingInputRule,
} from '@bangle.dev/pm';
import type Token from 'markdown-it/lib/token';
import { parentHasDirectParentOfType } from '@bangle.dev/pm-commands';
import { toggleList } from './list-item/commands';
import { listIsTight } from './list-item/list-is-tight';
import { createObject } from '@bangle.dev/utils';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {
  toggleOrderedList,
  queryIsOrderedListActive,
};
export const defaultKeys = {
  toggle: 'Shift-Ctrl-9',
};

const name = 'orderedList';
const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        order: {
          default: 1,
        },
        // a style preference attribute which be used for
        // rendering output.
        // For example markdown serializer can render a new line in
        // between or not.
        tight: {
          default: false,
        },
      },
      content: 'listItem+',
      group: 'block',
      parseDOM: [
        {
          tag: 'ol',
          getAttrs: (dom: any) => ({
            order: dom.hasAttribute('start') ? +dom.getAttribute('start')! : 1,
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
          getAttrs: (tok: Token, tokens: Token[], i: number) => {
            return {
              tight: listIsTight(tokens, i),
              order: +(tok.attrGet('start') ?? 1),
            };
          },
        },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      wrappingInputRule(
        /^(1)[.)]\s$/,
        type,
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1],
      ),
      keybindings &&
        keymap(createObject([[keybindings.toggle, toggleList(type)]])),
    ];
  };
}

export function toggleOrderedList(): Command {
  return (state, dispatch, view) => {
    return toggleList(
      state.schema.nodes.orderedList,
      state.schema.nodes.listItem,
    )(state, dispatch, view);
  };
}

export function queryIsOrderedListActive() {
  return (state: EditorState) => {
    const { schema } = state;
    return parentHasDirectParentOfType(schema.nodes['listItem'], [
      schema.nodes[name],
    ])(state);
  };
}
