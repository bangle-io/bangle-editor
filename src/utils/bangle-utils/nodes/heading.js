import {
  setBlockType,
  textblockTypeInputRule,
  toggleBlockType,
} from 'tiptap-commands';

import { Node } from './node';
import { moveNode } from './list-item/commands';

export class Heading extends Node {
  get name() {
    return 'heading';
  }

  get defaultOptions() {
    return {
      levels: [1, 2, 3, 4, 5, 6],
      classNames: {},
    };
  }

  get schema() {
    return {
      attrs: {
        level: {
          default: 1,
        },
      },
      content: 'inline*',
      group: 'block',
      defining: true,
      draggable: false,
      parseDOM: this.options.levels.map((level) => {
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
              this.options.classNames &&
              this.options.classNames[`h${node.attrs.level}`]
                ? this.options.classNames[`h${node.attrs.level}`]
                : undefined,
          },
          0,
        ];
      },
    };
  }

  commands({ type, schema }) {
    return (attrs) => toggleBlockType(type, schema.nodes.paragraph, attrs);
  }

  keys({ type, schema }) {
    return this.options.levels.reduce(
      (items, level) => ({
        ...items,
        ...{
          [`Shift-Ctrl-${level}`]: setBlockType(type, { level }),
        },
      }),
      {
        'Alt-ArrowUp': moveNode(type, schema.nodes.doc, 'UP'),
        'Alt-ArrowDown': moveNode(type, schema.nodes.doc, 'DOWN'),
      },
    );
  }

  inputRules({ type }) {
    return this.options.levels.map((level) =>
      textblockTypeInputRule(new RegExp(`^(#{1,${level}})\\s$`), type, () => ({
        level,
      })),
    );
  }
}
