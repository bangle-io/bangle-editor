export const spec = specFactory;

const name = 'doc';

function specFactory(opts = {}) {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: 'block+',
    },
  };
}
