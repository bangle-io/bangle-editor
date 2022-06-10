import type { BaseRawNodeSpec } from '../spec-registry';

export const spec = specFactory;

const name = 'doc';

function specFactory({ content = 'block+' } = {}): BaseRawNodeSpec {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: content,
    },
  };
}
