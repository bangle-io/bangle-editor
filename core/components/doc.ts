export const spec = specFactory;

const name = 'doc';

function specFactory({ content = 'block+' } = {}) {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: content,
    },
  };
}
