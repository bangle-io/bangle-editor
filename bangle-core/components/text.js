export const spec = specFactory;

const name = 'text';

function specFactory(opts = {}) {
  return {
    type: 'node',
    name,
    schema: {
      group: 'inline',
    },
    markdown: {
      toMarkdown(state, node) {
        state.text(node.text);
      },
    },
  };
}
