import { chainCommands, exitCode } from 'prosemirror-commands';
import { keymap } from 'prosemirror-keymap';

export const spec = specFactory;
export const plugins = pluginsFactory;
export const defaultKeys = {
  insert: 'Shift-Enter',
};

const getTypeFromSchema = (schema) => schema.nodes[name];

const name = 'hardBreak';

function specFactory(opts = {}) {
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
      parseMarkdown: {
        hardbreak: { node: 'hardBreak' },
      },
    },
  };
}

function pluginsFactory({ keybindings = defaultKeys } = {}) {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);
    const command = chainCommands(exitCode, (state, dispatch) => {
      if (dispatch) {
        dispatch(state.tr.replaceSelectionWith(type.create()).scrollIntoView());
      }
      return true;
    });
    return [
      keybindings &&
        keymap({
          [keybindings.insert]: command,
        }),
    ];
  };
}
