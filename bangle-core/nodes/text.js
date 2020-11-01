const name = 'text';

export const spec = (opts = {}) => {
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
};

export const plugins = (opts = {}) => {};
