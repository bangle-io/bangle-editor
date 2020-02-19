import { Extension } from '../extensions';

export class Node extends Extension {
  constructor(options = {}) {
    super(options);
  }

  get type() {
    return 'node';
  }

  get schema() {
    return null;
  }

  command() {
    return () => {};
  }
}
