import type { RawSpecs } from '../spec-registry';
import { Node } from '@bangle.dev/pm';

export const spec = specFactory;

const name = 'text';

function specFactory(): RawSpecs {
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
