import React from 'react';
import { getVersion } from 'prosemirror-collab';

import { EditorConnection } from './client/client';
import { Editor } from 'bangle-core';
import { CollabExtension } from './client/collab-extension';
import { uuid, handleAsyncError, simpleLRU } from 'bangle-core/utils/js-utils';
import { CollabError } from './collab-error';

const LOG = false;
let lru = LOG ? simpleLRU(30) : null;
window.lru = lru; // TODO remove lru

let log = LOG ? console.log.bind(console, 'collab/CollabClient') : () => {};
let lruSet = (reqId, obj) => {
  lru &&
    lru.set(reqId, {
      ...lru.get(reqId),
      ...(obj || {}),
    });
};

function localReq(manager) {
  const req = handleAsyncError(
    async ({ path, payload, reqId }) => {
      log(reqId, 'send request', payload.userId, 'path=', path);
      lruSet(reqId, { path, payload });
      const { body } = await manager.handleRequest(path, payload);
      lruSet(reqId, { response: body });
      return body;
    },
    (err) => {
      if (err instanceof CollabError) {
        throw err;
      }
      console.error('CRITICAL ERROR THROWN');
      console.error(err);
      throw err;
    },
  );

  return async (argObj) => {
    let reqId = uuid();
    lruSet(reqId, { sent: true });
    return req({ ...argObj, reqId });
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
        const body = await req({
          path: 'get_document',
          payload: { docName, userId },
        });
        return body;
      },
      pullEvents: async ({ version, docName }) => {
        const body = await req({
          path: 'get_events',
          payload: { docName, version, userId },
        });
        return body;
      },
      pushEvents: async ({ version, steps, clientID }, docName) => {
        const body = await req({
          path: 'push_events',
          payload: {
            clientID,
            version,
            steps,
            docName,
            userId,
          },
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
        this.editor && this.editor.destroy();
      },
    };

    this.connection = new EditorConnection(docName, handlersLocal, userId);
  }
  destroy() {
    this.connection.close();
    this.editor && this.editor.destroy();
  }
}
