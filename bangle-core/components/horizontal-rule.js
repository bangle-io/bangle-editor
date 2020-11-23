import { safeInsert } from 'bangle-core/utils/pm-utils';
import { InputRule } from 'prosemirror-inputrules';

export const spec = specFactory;
export const plugins = pluginsFactory;

const name = 'horizontal_rule';

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

function pluginsFactory({} = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
        if (!match[0]) {
          return null;
        }
        let tr = state.tr.replaceWith(start - 1, end, type.createChecked());
        return safeInsert(
          state.schema.nodes.paragraph.createChecked(),
          tr.selection.end,
        )(tr);
      }),
    ];
  };
}
