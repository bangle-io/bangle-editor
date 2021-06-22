import { Node } from 'prosemirror-model';

export const spec = specFactory;

const name = 'text';

function specFactory() {
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
