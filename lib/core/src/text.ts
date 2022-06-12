import { Node } from '@bangle.dev/pm';

import type { BaseRawNodeSpec } from './spec-registry';

export const spec = specFactory;

const name = 'text';

function specFactory(): BaseRawNodeSpec {
  return {
    type: 'node',
    name,
    schema: {
      group: 'inline',
    },
    markdown: {
      toMarkdown(state: any, node: Node) {
        state.text(node.text);
      },
    },
  };
}
