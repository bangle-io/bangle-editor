import { Node } from './node';

export class Doc extends Node {
  get name() {
    return 'doc';
  }

  get schema() {
    return {
      content: 'block+',
    };
  }
}
