import { Node } from '@bangle.dev/pm';
import { RawSpecs } from '../spec-registry';

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
