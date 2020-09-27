import { Node } from './node';
import { toggleList } from './list-item/commands';
import { wrappingInputRule } from 'prosemirror-inputrules';

export class OrderedList extends Node {
  get name() {
    return 'ordered_list';
  }

  get schema() {
    return {
      attrs: {
        order: {
          default: 1,
        },
      },
      content: 'list_item+',
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

      toMarkdown: (state, node) => {
        let start = node.attrs.order || 1;
        let maxW = String(start + node.childCount - 1).length;
        let space = state.repeat(' ', maxW + 2);
        state.renderList(node, space, (i) => {
          let nStr = String(start + i);
          return state.repeat(' ', maxW - nStr.length) + nStr + '. ';
        });
      },
    };
  }

  commands({ type, schema }) {
    return () => toggleList(type);
  }

  keys({ type, schema }) {
    return {
      'Shift-Ctrl-9': toggleList(type),
    };
  }

  inputRules({ type }) {
    return [
      wrappingInputRule(
        /^(1)[\.\)] $/,
        type,
        (match) => ({ order: +match[1] }),
        (match, node) => node.childCount + node.attrs.order === +match[1],
      ),
    ];
  }
}
