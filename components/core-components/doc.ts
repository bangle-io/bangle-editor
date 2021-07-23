import type { RawSpecs } from '@bangle.dev/core';

export const spec = specFactory;

const name = 'doc';

function specFactory({ content = 'block+' } = {}): RawSpecs {
  return {
    type: 'node',
    topNode: true,
    name,
    schema: {
      content: content,
    },
  };
}
