import React from 'react';
import { getVersion } from 'prosemirror-collab';

import { EditorConnection } from './client';
import { Editor } from '../../../utils/bangle-utils';
import { CollabExtension } from './collab-extension';
import { uuid, sleep } from '../../../utils/bangle-utils/utils/js-utils';

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

    // TODO this is complete lol
    if (response.code && response.code !== 200) {
      log('received code', response.code);
      response.status = response.code;
      return response;
    }
    return JSON.parse(response.body);
  };
}
export class CollabEditor {
  editor;

  constructor(domElement, options) {
    const { content: docName, collabClientId = 'test-' + uuid() } = options;
    const req = localReq(options.manager);
    const userId = 'user-' + collabClientId;

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
        this.editor = new Editor(domElement, {
          ...options,
          content: document,
          extensions: [
            ...options.extensions,
            new CollabExtension({
              version,
              clientID: collabClientId,
            }),
          ],
        });
        return this.editor.state;
      },
      updateState: (state) => {
        log('version', userId, getVersion(state));
        this.editor.view.updateState(state);
      },
      onDispatchTransaction: (cb) => {
        // todo need to make this sync as it is causing problems
        // especially with trailing node
        this.editor.on('transaction', ({ transaction }) => {
          cb(transaction);
        });
      },
      destroyView: () => {
        this.editor.destroy();
      },
    };

    this.connection = new EditorConnection(docName, handlersLocal, userId);
  }
  destroy() {
    this.connection.close();
    this.editor.destroy();
  }
}
