import { collab } from 'prosemirror-collab';
import { Extension } from '../../../utils/bangle-utils';

export class CollabExtension extends Extension {
  get name() {
    return 'collab_extension';
  }

  get plugins() {
    return [
      collab({
        version: this.options.version,
        clientID: this.options.clientID,
      }),
    ];
  }
}
