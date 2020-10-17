import { toggleBlockType } from 'tiptap-commands';
import { setBlockType } from 'prosemirror-commands';
import { textblockTypeInputRule } from 'prosemirror-inputrules';

import { Node } from './node';
import { moveNode } from './list-item/commands';
import { filter, findParentNodeOfType, insertEmpty } from '../utils/pm-utils';
import { copyEmptyCommand, cutEmptyCommand } from '../core-commands';

export class Heading extends Node {
  get name() {
    return 'heading';
  }

  get defaultOptions() {
    return {
      levels: ['1', '2', '3', '4', '5', '6'],
      classNames: {},
    };
  }

  get schema() {
    return {
      attrs: {
        level: {
          default: '1',
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

  get markdown() {
    return {
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
    };
  }

  commands({ type, schema }) {
    return (attrs) => toggleBlockType(type, schema.nodes.paragraph, attrs);
  }

  keys({ type, schema }) {
    const isInHeading = (state) => findParentNodeOfType(type)(state.selection);

    return this.options.levels.reduce(
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
