import { InputRule } from 'prosemirror-inputrules';

const name = 'horizontal_rule';

const getTypeFromSchema = (schema) => schema.nodes[name];

export const spec = (opts = {}) => {
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
      parseMarkdown: { hr: { node: 'horizontal_rule' } },
    },
  };
};

export const plugins = ({ keybindings = {} } = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
        if (!match[0]) {
          return false;
        }
        return state.tr.replaceWith(start - 1, end, type.create({}));
      }),
    ];
  };
};
