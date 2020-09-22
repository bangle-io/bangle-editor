import { CollabExtension } from './collab-extension';
import { uuid } from 'bangle-core/utils/js-utils';
import { Editor } from 'bangle-core/index';
import { collabRequestHandlers } from './collab-request-handlers';

const LOG = false;
const log = LOG ? console.log.bind(console, 'collab/collab-editor') : () => {};

export class CollabEditor {
  constructor(domElement, options) {
    const {
      manager,
      content: docName,
      collabClientId = 'test-' + uuid(),
      ...editorOptions
    } = options;

    if (!manager || !docName) {
      throw new Error('Missing options in CollabEditor');
    }

    this.editor = new Editor(domElement, {
      ...editorOptions,
      content: 'Loading document',
      extensions: [
        ...editorOptions.extensions,
        new CollabExtension({
          docName,
          clientID: collabClientId,
          ...collabRequestHandlers((...args) =>
            manager.handleRequest(...args).then((resp) => resp.body),
          ),
        }),
      ],
    });
  }

  destroy() {
    this.editor && this.editor.destroy();
  }
}
