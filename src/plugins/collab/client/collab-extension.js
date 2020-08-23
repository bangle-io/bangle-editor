import { Extension } from '../../../utils/bangle-utils';
import {
  collab,
  sendableSteps,
  getVersion,
  receiveTransaction,
} from 'prosemirror-collab';

export class CollabExtension extends Extension {
  get name() {
    return 'collab_extension';
  }

  get plugins() {
    return [collab({ version: this.options.version })];
  }
}
