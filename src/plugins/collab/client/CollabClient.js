import React from 'react';
import { EditorConnection } from './client';
import { Editor } from '../../../utils/bangle-utils';
import { CollabExtension } from './collab-extension';
import { uuid, sleep } from '../../../utils/bangle-utils/utils/js-utils';
import { Manager } from '../server/manager';
import { getVersion } from 'prosemirror-collab';

const url = `http://localhost:8000/docs/`;
const LOG = false;

function log(...args) {
  if (LOG) console.log('collab/CollabClient', ...args);
}

function localReq(manager) {
  return async (path, payload) => {
    const response = await manager.handleRequest(path, payload);
    if (response instanceof Error) {
      console.error(response);
      throw response;
    }
    if (response.code && response.code !== 200) {
      log('received code', response.code);
      response.state = response.code;
      return response;
    }
    return JSON.parse(response.body);
  };
}
export class CollabEditor {
  constructor(domElement, options, docName, manager) {
    const req = localReq(manager);
    const userId = parseInt(Math.random() * 100);
    let editor;
    const handlersLocal = {
      getDocument: async ({ docName }) => {
        const body = await req('get_document', { docName, userId });
        return body;
      },
      pullEvents: async ({ version, docName }) => {
        const body = await req('get_events', { docName, version, userId });
        return body;
      },
      pushEvents: async ({ version, steps, clientID }, docName) => {
        const body = await req('push_events', {
          clientID,
          version,
          steps,
          docName,
          userId,
        });
        return body;
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
        log('version', userId, getVersion(state));
        editor.view.updateState(state);
      },
      onDispatchTransaction: (cb) => {
        // todo need to make this sync as it is causing problems
        // especially with trailing node
        editor.on('transaction', ({ transaction }) => {
          cb(transaction);
        });
      },
      destroyView: () => {
        editor.destroy();
      },
    };

    this.connection = new EditorConnection(docName, handlersLocal, userId);
  }
  destroy() {
    this.connection.close();
    this.editor.destroy();
  }
}
