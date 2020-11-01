const name = 'doc';

export const spec = (opts = {}) => {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: 'block+',
    },
  };
};

export const plugins = (opts = {}) => {
  return ({ schema }) => [];
};
