import { Extension } from '../extensions/extension';

export class Mark extends Extension {
  constructor(options = {}) {
    super(options);
  }

  get type() {
    return 'mark';
  }

  get schema() {
    return null;
  }

  command() {
    return () => {};
  }
}
