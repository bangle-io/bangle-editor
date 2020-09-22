import {
  collab,
  receiveTransaction,
  getVersion,
  sendableSteps,
} from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';
import { Extension } from 'bangle-core/extensions';
import { Plugin, PluginKey } from 'prosemirror-state';
import { getIdleCallback, sleep } from 'bangle-core/utils/js-utils';
import { Emitter } from 'bangle-core/utils/emitter';
import {
  cancelablePromise,
  serialExecuteQueue,
} from 'bangle-core/utils/js-utils';
import { strictCheckObject, replaceDocument } from './helpers';
import { CollabError } from '../collab-error';

const LOG = true;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};
const RECOVERY_BACK_OFF = 50;

export const bangleCollabSettingsKey = new PluginKey('bangleCollabSettingsKey');

export const getCollabSettings = (state) => {
  return bangleCollabSettingsKey.getState(state);
};

export class CollabExtension extends Extension {
  get name() {
    return 'collab_extension';
  }

  get plugins() {
    return [
      collab({
        clientID: this.options.clientID,
      }),

      new Plugin({
        key: bangleCollabSettingsKey,
        state: {
          init: (_, state) => {
            return {
              docName: this.options.docName,
              clientID: this.options.clientID,
              userId: 'user-' + this.options.clientID,
              ready: false,
            };
          },
          apply: (tr, value) => {
            if (tr.getMeta('collabClientStateReady')) {
              return {
                ...value,
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
            if (tr.getMeta('collabClientStateSetup') === true) {
              return true;
            }

            if (!bangleCollabSettingsKey.getState(state).ready) {
              log('skipping transaction');
              return false;
            }
          }

          return true;
        },
      }),

      bangleCollabPlugin({
        getDocument: this.options.getDocument,
        pullEvents: this.options.pullEvents,
        pushEvents: this.options.pushEvents,
      }),
    ];
  }
}

export function bangleCollabPlugin({ getDocument, pullEvents, pushEvents }) {
  let connection;
  const bangleCollabPluginKey = new PluginKey('bangleCollabPluginKey');
  const restart = (view) => {
    log('restarting connection');
    connection.destroy();
    connection = newConnection(view);
  };

  const newConnection = (view) => {
    return connectionManager({
      view,
      restart,
      getDocument,
      pullEvents,
      pushEvents,
    });
  };

  return new Plugin({
    key: bangleCollabPluginKey,
    state: {
      init() {
        return null;
      },
      apply(tr, pluginState, prevState, newState) {
        if (
          !tr.getMeta('isRemote') &&
          bangleCollabSettingsKey.getState(newState).ready
        ) {
          if (connection) {
            connection.pushNewEvents();
          }
        }
        return pluginState;
      },
    },
    view(view) {
      connection = newConnection(view);
      return {
        destroy() {
          connection.destroy();
          connection = null;
        },
      };
    },
  });
}

export function connectionManager({
  view,
  restart,
  getDocument,
  pullEvents,
  pushEvents,
}) {
  let recoveryBackOff = 0;
  const onReceiveSteps = (payload) => {
    strictCheckObject(payload, {
      steps: 'array-of-objects',
      clientIDs: 'array-of-strings',
    });

    const { clientIDs, steps } = payload;
    if (steps.length === 0) {
      log('no steps', payload);
      return false;
    }

    const tr = receiveTransaction(view.state, steps, clientIDs)
      .setMeta('addToHistory', false)
      .setMeta('isRemote', true);
    const newState = view.state.apply(tr);
    view.updateState(newState);
    return;
  };

  const pullEmitter = pullEventsEmitter(view, pullEvents)
    .on('steps', (payload) => {
      recoveryBackOff = 0;
      onReceiveSteps(payload);
      // Push any steps that might still be hanging around
      // this is a no-op if there are no sendable steps
      pushEmitter.emit('push');
      getIdleCallback(() => {
        pullEmitter.emit('pull');
      });
    })
    .on('error', (error) => {
      onError(error);
    });

  const pushEmitter = pushEventsEmitter(view, pushEvents).on(
    'error',
    (error) => {
      onError(error);
    },
  );

  const initializeEmitter = collabInitializeEmitter(view, getDocument)
    .emit('initialize')
    .on('stateIsReady', () => {
      pullEmitter.emit('pull');
    })
    .on('error', (error) => {
      onError(error);
    });

  const onError = (error) => {
    const { errorCode, errorFrom } = error;
    if (!(error instanceof CollabError)) {
      console.error(error);
      throw error;
    }
    log('received error', errorCode, error.message);

    // If initialization failed, regardless of error code
    // we will need to restart setting up the initial state
    if (errorFrom === 'initialize') {
      restart(view);
      return;
    }
    switch (errorCode) {
      // invalid version
      case 400:
      case 410: {
        // bad version
        // TODO when restarting preserve the selection
        restart(view);
        return;
      }
      case 409: {
        log('received 409 pulling');
        pullEmitter.emit('pull');
        return;
      }
      default: {
        // recover
        recoveryBackOff = recoveryBackOff
          ? Math.min(recoveryBackOff * 2, 6e4)
          : RECOVERY_BACK_OFF;
        log('attempting recover', recoveryBackOff);
        sleep(recoveryBackOff).then(() => {
          pullEmitter.emit('pull');
        });
      }
    }
  };

  return {
    pushNewEvents: () => {
      pushEmitter.emit('push');
    },
    destroy: () => {
      log('destroying');
      pullEmitter.destroy();
      pushEmitter.destroy();
      initializeEmitter.destroy();
    },
  };
}

/**
 *
 * A helper function to poll the Authority and emit newly received steps.
 * @returns {Emitter} An emitter emits steps or error and listens for pull events
 */
export function pullEventsEmitter(view, pullEvents) {
  const emitter = new Emitter();

  let cProm;

  const pull = () => {
    // Only opt for the latest pull and cancel others
    if (cProm) {
      cProm.cancel();
    }
    const collabSettings = getCollabSettings(view.state);
    cProm = cancelablePromise(
      pullEvents({
        version: getVersion(view.state),
        docName: collabSettings.docName,
        userId: collabSettings.userId,
      }),
    );

    cProm.promise
      .then((data) => {
        log('pull received', data);
        // TODO make sure the server responds with empty arrays
        // instead of us hotfixing it here
        const steps = data.steps ? data.steps : [];
        const clientIDs = data.clientIDs ? data.clientIDs : [];
        emitter.emit('steps', {
          steps: steps.map((j) => Step.fromJSON(view.state.schema, j)),
          clientIDs: clientIDs,
        });
      })
      .catch((error) => {
        if (error.isCanceled) {
          return;
        }
        error.from = 'pull';
        emitter.emit('error', error);
      });
  };
  emitter.on('pull', pull);
  return emitter;
}

export function pushEventsEmitter(view, pushEvents) {
  const emitter = new Emitter();
  const queue = serialExecuteQueue();

  const push = async () => {
    await queue.add(async () => {
      const steps = sendableSteps(view.state);
      if (!steps) {
        log('no steps');
        return;
      }
      const collabSettings = getCollabSettings(view.state);

      // If successful When pushing our own changes expect server to send an update to
      // make our changes from unconfirmed to confirmed (i.e. a version change).
      return pushEvents({
        version: getVersion(view.state),
        steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
        clientID: steps ? steps.clientID : 0,
        docName: collabSettings.docName,
        userId: collabSettings.userId,
      }).catch((error) => {
        error.from = 'push';
        emitter.emit('error', error);
      });
    });
  };

  emitter.on('push', push);
  return emitter;
}

export function collabInitializeEmitter(view, getDocument) {
  const emitter = new Emitter();
  const collabSettings = getCollabSettings(view.state);

  emitter
    .on('initialize', async () => {
      getDocument({
        docName: collabSettings.docName,
        userId: collabSettings.userId,
      }).then(
        (payload) => {
          const { doc, version } = payload;
          // We are breaking into two steps, so that in case the view was destroyed
          // or there was a networking error, 'initializeState' will not be invoked.
          emitter.emit('initializeState', { doc, version });
        },
        (error) => {
          error.from = 'initialize';
          emitter.emit('error', error);
        },
      );
    })
    .on('initializeState', (payload) => {
      strictCheckObject(payload, { doc: 'object', version: 'number' });
      const { doc, version } = payload;
      const tr = replaceDocument(view.state, doc, version);
      const newState = view.state.apply(
        tr.setMeta('isRemote', true).setMeta('collabClientStateSetup', true),
      );
      view.updateState(newState);
      view.dispatch(view.state.tr.setMeta('collabClientStateReady', true));
      emitter.emit('stateIsReady');
      return;
    });

  return emitter;
}
