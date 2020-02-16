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
}
