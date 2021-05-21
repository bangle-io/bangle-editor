import { safeInsert } from '../utils/pm-utils';
import { InputRule } from 'prosemirror-inputrules';

export const spec = specFactory;
export const plugins = pluginsFactory;

const name = 'horizontalRule';

const getTypeFromSchema = (schema) => schema.nodes[name];

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM: () => ['hr'],
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(node.attrs.markup || '---');
        state.closeBlock(node);
      },
      parseMarkdown: { hr: { node: name } },
    },
  };
}

function atLastLeafNode($pos) {
  return $pos.pos >= $pos.node(0).content.size - $pos.depth - 1;
}

function pluginsFactory({ markdownShortcut = true } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markdownShortcut &&
        new InputRule(
          /^(?:---|___\s|\*\*\*\s)$/,
          (state, match, start, end) => {
            if (!match[0]) {
              return null;
            }
            let tr = state.tr.replaceWith(start - 1, end, type.createChecked());
            // Insert a new parapgrah after the hr only if it is the last node.
            const isLastNode = atLastLeafNode(tr.selection.$from);
            return !isLastNode
              ? tr
              : safeInsert(state.schema.nodes.paragraph.createChecked())(tr);
          },
        ),
    ];
  };
}
