import { Node } from './node';

export class Text extends Node {
  get name() {
    return 'text';
  }

  get schema() {
    return {
      group: 'inline',
    };
  }

  get markdown() {
    return {
      toMarkdown(state, node) {
        state.text(node.text);
      },
    };
  }
}
