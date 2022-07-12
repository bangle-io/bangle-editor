import { collab } from 'prosemirror-collab';

import { CollabManager } from '@bangle.dev/collab-server';
import { EditorState, Plugin } from '@bangle.dev/pm';
import { Emitter, uuid } from '@bangle.dev/utils';

import { collabClient } from './collab-client';
import { collabPluginKey, collabSettingsKey } from './helpers';

const LOG = true;
const LOG_VERBOSE = false;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};
let logVerbose = LOG_VERBOSE
  ? console.log.bind(console, 'collab/collab-extension')
  : () => {};

export const plugins = pluginsFactory;
export const commands = {};

export const RECOVERY_BACK_OFF = 50;

interface CollabSettings {
  docName: string;
  clientID: string;
  userId: string;
  ready: boolean;
}
export const getCollabSettings = (state: EditorState): CollabSettings => {
  return collabSettingsKey.getState(state);
};

function pluginsFactory({
  clientID = 'client-' + uuid(),
  docName,
  sendManagerRequest,
  docChangeEmitter,
  retryWaitTime = 100,
}: {
  clientID: string;
  docName: string;
  sendManagerRequest: CollabManager['handleRequest2'];
  docChangeEmitter: Emitter;
  retryWaitTime?: number;
}) {
  return () => {
    return [
      collab({
        clientID,
      }),

      new Plugin({
        key: collabSettingsKey,
        state: {
          init: (_, _state) => {
            return {
              docName: docName,
              clientID: clientID,
              userId: 'user-' + clientID,
              ready: false,
            };
          },
          apply: (tr, value) => {
            if (tr.getMeta(collabSettingsKey)) {
              return {
                ...value,
                ...tr.getMeta(collabSettingsKey),
              };
            }
            return value;
          },
        },
        filterTransaction(tr, state) {
          // Don't allow transactions that modifies the document before
          // collab is ready.
          if (tr.docChanged) {
            // Let collab client's setup tr's go through
            if (tr.getMeta('bangle/allowUpdatingEditorState') === true) {
              return true;
            }
            // prevent any other tr until state is ready
            if (!collabSettingsKey.getState(state).ready) {
              log('skipping transaction');
              return false;
            }
          }
          return true;
        },
      }),

      collabMachinePlugin({
        sendManagerRequest,
        docChangeEmitter,
        retryWaitTime,
      }),
    ];
  };
}

function collabMachinePlugin({
  sendManagerRequest,
  docChangeEmitter,
  retryWaitTime,
}: {
  sendManagerRequest: CollabManager['handleRequest2'];
  docChangeEmitter: Emitter;
  retryWaitTime: number;
}) {
  let instance: ReturnType<typeof collabClient> | undefined;

  return new Plugin({
    key: collabPluginKey,
    state: {
      init() {
        return null;
      },
      apply(tr, pluginState, _prevState, newState) {
        if (
          !tr.getMeta('bangle/isRemote') &&
          collabSettingsKey.getState(newState).ready
        ) {
          setTimeout(() => {
            instance?.onLocalEdits();
          }, 0);
        }
        return pluginState;
      },
    },
    view(view) {
      const onDocChanged = () => {
        instance?.onUpstreamChange();
      };

      if (!instance) {
        const collabSettings = getCollabSettings(view.state);
        instance = collabClient({
          docName: collabSettings.docName,
          clientID: collabSettings.clientID,
          userId: collabSettings.userId,
          schema: view.state.schema,
          sendManagerRequest,
          retryWaitTime,
          view,
        });
        docChangeEmitter.on('doc_changed', onDocChanged);
      }

      return {
        update() {},
        destroy() {
          instance?.destroy();
          instance = undefined;
          docChangeEmitter.off('doc_changed', onDocChanged);
        },
      };
    },
  });
}
