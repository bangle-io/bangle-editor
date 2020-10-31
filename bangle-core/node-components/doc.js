const name = 'doc';

export const spec = (opts = {}) => {
  return {
    type: 'node',
    name,
    schema: {
      content: 'block+',
    },
  };
};

export const plugins = (opts = {}) => {
  return {};
};
