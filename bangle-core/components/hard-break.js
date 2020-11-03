import { chainCommands, exitCode } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

const getTypeFromSchema = (schema) => schema.nodes[name];

const name = 'hard_break';

export const spec = (opts = {}) => {
  return {
    type: 'node',
    name,
    schema: {
      inline: true,
      group: 'inline',
      selectable: false,
      parseDOM: [{ tag: 'br' }],
      toDOM: () => ['br'],
    },
    markdown: {
      toMarkdown(state, node, parent, index) {
        for (let i = index + 1; i < parent.childCount; i++) {
          if (parent.child(i).type !== node.type) {
            state.write('\\\n');
            return;
          }
        }
      },
      parseMarkdown: { hardbreak: { node: 'hard_break' } },
    },
  };
};

export const plugins = (opts = {}) => {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const command = chainCommands(exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      return true;
    });
    return [
      keymap({
        'Shift-Enter': command,
      }),
    ];
  };
};
