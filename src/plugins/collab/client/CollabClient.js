import React from 'react';
import { EditorConnection } from './client';
import { LocalServer } from '../../local-persist/local-persist';
import { Editor } from '../../../utils/bangle-utils';
import { CollabExtension } from './collab-extension';
import { uuid, sleep } from '../../../utils/bangle-utils/utils/js-utils';

const url = `http://localhost:8000/docs/`;

async function req(...args) {
  return fetch(...args).then(async (r) => {
    if (!r.ok) {
      const error = new Error(await r.text());
      error.status = r.status;
      throw error;
    }
    return r.json();
  });
}

export class CollabEditor {
  constructor(domElement, options = {}) {
    // const dummyEditor = new Editor(domElement, {
    //   ...options,
    //   manualViewCreate: true,
    // });
    // const schema = dummyEditor.schema;
    // const localServer = new LocalServer(schema, options.content);
    // dummyEditor.destroy();
    // const ipAddress = parseInt(Math.random() * 100);
    let editor;
    const handlers = {
      getDocument: async ({ docName }) => {
        return req(url + docName);
      },
      pullEvents: async ({ version, docName }) => {
        return req(url + docName + `/events?version=${version}`);
      },
      pushEvents: async ({ version, steps, clientID }, docName) => {
        return req(url + docName + '/events', {
          method: 'post',
          body: JSON.stringify({ version, steps, clientID, comment: [] }),
        });
      },
      createEditorState: async (document, version) => {
        editor = new Editor(domElement, {
          ...options,
          content: document,
          extensions: [
            ...options.extensions,
            new CollabExtension({
              version,
              clientID: 'test-' + uuid(),
            }),
          ],
        });
        return editor.state;
      },
      updateState: (state) => {
        editor.view.updateState(state);
      },
      onDispatchTransaction: (cb) => {
        editor.on('transaction', ({ transaction }) => {
          cb(transaction);
        });
      },
      destroyView: () => {
        editor.destroy();
      },
    };
    this.connection = new EditorConnection('ole', handlers);
  }
}
