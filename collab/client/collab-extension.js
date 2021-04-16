import {
  collab,
  receiveTransaction,
  getVersion,
  sendableSteps,
} from 'prosemirror-collab';
import { Step } from '@bangle.dev/core/prosemirror/transform';
import {
  Plugin,
  PluginKey,
  Selection,
} from '@bangle.dev/core/prosemirror/state';
import {
  getIdleCallback,
  sleep,
  uuid,
  cancelablePromise,
  serialExecuteQueue,
} from '@bangle.dev/core/utils/js-utils';

import { replaceDocument } from './helpers';
import { CollabError } from '../collab-error';
import { Emitter } from './emitter';

const LOG = false;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

export const RECOVERY_BACK_OFF = 50;
export const collabSettingsKey = new PluginKey('bangle/collabSettingsKey');
export const collabPluginKey = new PluginKey('bangle/collabPluginKey');

export const getCollabSettings = (state) => {
  return collabSettingsKey.getState(state);
};

const name = 'collab_extension';

function specFactory(opts = {}) {
  return {
    name,
    type: 'component',
  };
}

function pluginsFactory({
  clientID = 'client-' + uuid(),
  docName,
  getDocument,
  pullEvents,
  pushEvents,
} = {}) {
  return () => {
    return [
      collab({
        clientID,
      }),

      new Plugin({
        key: collabSettingsKey,
        state: {
          init: (_, state) => {
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

      bangleCollabPlugin({
        getDocument: getDocument,
        pullEvents: pullEvents,
        pushEvents: pushEvents,
      }),
    ];
  };
}

function bangleCollabPlugin({ getDocument, pullEvents, pushEvents }) {
  let connection;
  const restart = (view) => {
    log('restarting connection');
    const oldSelection = view.state.selection;
    if (connection) {
      connection.destroy();
    }
    connection = newConnection(view);
    connection.init(oldSelection);
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
    key: collabPluginKey,
    state: {
      init() {
        return null;
      },
      apply(tr, pluginState, prevState, newState) {
        if (
          !tr.getMeta('bangle/isRemote') &&
          collabSettingsKey.getState(newState).ready
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
      // TODO is it safe to do this here
      connection.init();

      return {
        update() {},
        destroy() {
          if (connection) {
            connection.destroy();
            connection = null;
          }
        },
      };
    },
  });
}

function connectionManager({
  view,
  restart,
  getDocument,
  pullEvents,
  pushEvents,
}) {
  let recoveryBackOff = 0;
  const onReceiveSteps = (payload) => {
    const { clientIDs, steps } = payload;
    if (steps.length === 0) {
      log('no steps', payload);
      return false;
    }

    const tr = receiveTransaction(view.state, steps, clientIDs)
      .setMeta('addToHistory', false)
      .setMeta('bangle/isRemote', true);
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

  const initEmitter = collabInitEmitter(view, getDocument)
    .on('stateIsReady', () => {
      pullEmitter.emit('pull');
    })
    .on('error', (error) => {
      onError(error);
    });

  const onError = (error) => {
    const { errorCode, from } = error;
    if (!(error instanceof CollabError)) {
      throw error;
    }
    log('received error', errorCode, error.message, error.from);

    // If initialization failed, regardless of error code
    // we will need to restart setting up the initial state
    if (from === 'init') {
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
        // TODO add somee helpful api here for user to react to this
        sleep(recoveryBackOff).then(() => {
          pullEmitter.emit('pull');
        });
      }
    }
  };

  return {
    init: (oldSelection) => {
      initEmitter.emit('init', oldSelection);
    },
    pushNewEvents: () => {
      pushEmitter.emit('push');
    },
    destroy: () => {
      log('destroying');
      pullEmitter.destroy();
      pushEmitter.destroy();
      initEmitter.destroy();
    },
  };
}

/**
 *
 * A helper function to poll the Authority and emit newly received steps.
 * @returns {Emitter} An emitter emits steps or error and listens for pull events
 */
function pullEventsEmitter(view, pullEvents) {
  const emitter = new Emitter();

  let cProm;

  const pull = () => {
    // Only opt for the latest pull and cancel others.
    // Canceling a pull request is safe, as it doesn't
    // introduce any side-effects on the server side.
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

function pushEventsEmitter(view, pushEvents) {
  const emitter = new Emitter();
  const queue = serialExecuteQueue();

  const push = async () => {
    // TODO add debounce
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

function collabInitEmitter(view, getDocument) {
  const emitter = new Emitter();
  const collabSettings = getCollabSettings(view.state);
  emitter
    .on('init', async (oldSelection) => {
      // init can be called any time when we want to
      // restart the collab setup, so we first mark state as not ready
      // to prevent any unnecessary changes
      view.dispatch(view.state.tr.setMeta(collabSettingsKey, { ready: false }));
      getDocument({
        docName: collabSettings.docName,
        userId: collabSettings.userId,
      }).then(
        (payload) => {
          const { doc, version } = payload;
          // We are breaking into two steps, so that in case the view was destroyed
          // or there was a networking error, 'initCollabState' will not be invoked.
          emitter.emit('initCollabState', { doc, version }, oldSelection);
        },
        (error) => {
          error.from = 'init';
          emitter.emit('error', error);
        },
      );
    })
    .on('initCollabState', (payload, oldSelection) => {
      const { doc, version } = payload;
      let tr = replaceDocument(view.state, doc, version);

      if (oldSelection) {
        let { from } = oldSelection;
        if (from >= tr.doc.content.size) {
          tr = tr.setSelection(Selection.atEnd(tr.doc));
        } else {
          tr = tr.setSelection(Selection.near(tr.doc.resolve(from)));
        }
      }

      const newState = view.state.apply(
        tr
          .setMeta('bangle/isRemote', true)
          .setMeta('bangle/allowUpdatingEditorState', true),
      );
      view.updateState(newState);

      view.dispatch(view.state.tr.setMeta(collabSettingsKey, { ready: true }));
      emitter.emit('stateIsReady');
      return;
    });

  return emitter;
}
