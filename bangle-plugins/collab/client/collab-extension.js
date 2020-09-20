import { collab } from 'prosemirror-collab';
import { Extension } from 'bangle-core/extensions';
import { Plugin, PluginKey } from 'prosemirror-state';
const LOG = true;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};

export const collabReadyKey = new PluginKey('collab-ready');

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
      new Plugin({
        key: collabReadyKey,
        state: {
          init: (_, state) => {
            return {
              ready: false,
            };
          },
          apply: (tr, value) => {
            if (tr.getMeta('collabStateReady')) {
              return {
                ready: true,
              };
            }
            return value;
          },
        },
        filterTransaction(tr, state) {
          // Don't allow transactions that modifies the document before
          // collab is ready.
          if (tr.docChanged) {
            // Let collab client's setup transaction go through
            if (tr.getMeta('collabClientSetup') === true) {
              return true;
            }
            if (!collabReadyKey.getState(state).ready) {
              log('skipping transaction');
              return false;
            }
          }

          return true;
        },
      }),
    ];
  }
}
