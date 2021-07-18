import {
  cancelablePromise,
  CollabError,
  GetDocument,
  getIdleCallback,
  PullEvents,
  PushEvents,
  serialExecuteQueue,
  sleep,
  uuid,
} from '@bangle.dev/collab-server';
import {
  collab,
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab';
import {
  Schema,
  EditorState,
  Plugin,
  PluginKey,
  Selection,
  TextSelection,
  Step,
  EditorView,
} from '@bangle.dev/pm';

import StrictEventEmitter from 'strict-event-emitter-types';
import { Emitter } from '@bangle.dev/utils';
import { replaceDocument } from './helpers';

type UnPromisify<T> = T extends Promise<infer U> ? U : T;
type CollabConnectionObj = {
  init: (oldSelection?: Selection) => void;
  pushNewEvents: () => void;
  destroy: () => void;
};

const LOG = false;
let log = LOG ? console.log.bind(console, 'collab/collab-extension') : () => {};

export const spec = specFactory;
export const plugins = pluginsFactory;
export const commands = {};

export const RECOVERY_BACK_OFF = 50;
export const collabSettingsKey = new PluginKey('bangle/collabSettingsKey');
export const collabPluginKey = new PluginKey('bangle/collabPluginKey');

export const getCollabSettings = (state: EditorState<Schema>) => {
  return collabSettingsKey.getState(state);
};

const name = 'collab_extension';

function specFactory(_opts = {}) {
  return {
    name,
    type: 'component',
  };
}

type OnFatalError = (error: CollabError) => boolean;

function pluginsFactory({
  clientID = 'client-' + uuid(),
  docName,
  getDocument,
  pullEvents,
  pushEvents,
  onFatalError = () => true,
}: {
  clientID: string;
  docName: string;
  getDocument: GetDocument;
  pullEvents: PullEvents;
  pushEvents: PushEvents;
  onFatalError: OnFatalError;
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

      bangleCollabPlugin({
        getDocument: getDocument,
        pullEvents: pullEvents,
        pushEvents: pushEvents,
        onFatalError,
      }),
    ];
  };
}

function bangleCollabPlugin({
  getDocument,
  pullEvents,
  pushEvents,
  onFatalError,
}: {
  getDocument: GetDocument;
  pullEvents: PullEvents;
  pushEvents: PushEvents;
  onFatalError: OnFatalError;
}) {
  let connection: CollabConnectionObj | undefined;
  const restart = (view: EditorView) => {
    log('restarting connection');
    const oldSelection = view.state.selection;
    if (connection) {
      connection.destroy();
    }
    connection = newConnection(view);
    connection.init(oldSelection);
  };

  const newConnection = (view: EditorView) => {
    return connectionManager({
      view,
      restart,
      getDocument,
      pullEvents,
      pushEvents,
      onFatalError,
    });
  };

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
            connection = undefined;
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
  onFatalError,
}: {
  view: EditorView;
  restart: (view: EditorView) => void;
  getDocument: GetDocument;
  pullEvents: PullEvents;
  pushEvents: PushEvents;
  onFatalError: OnFatalError;
}): CollabConnectionObj {
  let recoveryBackOff = 0;
  let managerId: string | undefined = undefined;
  const getManagerId = () => {
    if (!managerId) {
      throw new Error('ManagerId not defined');
    }
    return managerId;
  };

  const onReceiveSteps = (payload: UnPromisify<ReturnType<PullEvents>>) => {
    // TODO name these steps as rawSteps
    // TODO make sure the data is always []
    const steps = (payload.steps ? payload.steps : []).map((j) =>
      Step.fromJSON(view.state.schema, j),
    );
    const clientIDs = payload.clientIDs ? payload.clientIDs : [];

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

  const pullEmitter = pullEventsEmitter(view, pullEvents, getManagerId)
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

  const pushEmitter = pushEventsEmitter(view, pushEvents, getManagerId).on(
    'error',
    (error) => {
      onError(error);
    },
  );

  const initEmitter = collabInitEmitter(view, getDocument)
    .on('stateIsReady', (_managerId) => {
      managerId = _managerId;
      pullEmitter.emit('pull');
    })
    .on('error', (error) => {
      onError(error);
    });
  const backoffSleep = () => {
    recoveryBackOff = recoveryBackOff
      ? Math.min(recoveryBackOff * 2, 6e6)
      : RECOVERY_BACK_OFF;
    log('attempting recover', recoveryBackOff);
    return sleep(recoveryBackOff);
  };

  const onError = (error: CollabError) => {
    const { errorCode, from } = error;
    if (!(error instanceof CollabError)) {
      throw error;
    }
    log('received error', errorCode, error.message, error.from);

    // If initialization failed, regardless of error code
    // we will need to restart setting up the initial state
    if (from === 'init') {
      const result = onFatalError(error);
      if (result) {
        sleep(50).then(() => {
          restart(view);
        });
      }
      return;
    }
    switch (errorCode) {
      // invalid version
      case 400:
      case 410: {
        // bad version or manager id
        restart(view);
        return;
      }
      case 409: {
        log('received 409 pulling');
        pullEmitter.emit('pull');
        return;
      }
      case 500: {
        // recover
        const result = onFatalError(error);
        if (result) {
          backoffSleep().then(() => {
            pullEmitter.emit('pull');
          });
        }
        return;
      }
      default: {
        console.error(error);
        throw new Error('Unknown error code ' + errorCode);
      }
    }
  };

  return {
    init: (oldSelection?: Selection) => {
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
function pullEventsEmitter(
  view: EditorView,
  pullEvents: PullEvents,
  getManagerId: () => string,
) {
  interface Events {
    error: (error: CollabError) => void;
    steps: (obj: UnPromisify<ReturnType<PullEvents>>) => void;
    pull: () => void;
  }
  const emitter: StrictEventEmitter<Emitter, Events> = new Emitter();

  let cProm: { promise: ReturnType<PullEvents>; cancel: () => void };

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
        managerId: getManagerId(),
      }),
    );

    cProm.promise
      .then((data) => {
        log('pull received', data);
        emitter.emit('steps', data);
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

function pushEventsEmitter(
  view: EditorView,
  pushEvents: PushEvents,
  getManagerId: () => string,
) {
  interface Events {
    error: (error: CollabError) => void;
    push: () => void;
  }
  const emitter: StrictEventEmitter<Emitter, Events> = new Emitter();
  const queue = serialExecuteQueue();

  emitter.on('push', async () => {
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
        // TODO  the default value numerical 0 before
        clientID: (steps ? steps.clientID : 0) + '',
        docName: collabSettings.docName,
        userId: collabSettings.userId,
        managerId: getManagerId(),
      }).catch((error) => {
        error.from = 'push';
        emitter.emit('error', error);
      });
    });
  });
  return emitter;
}

function collabInitEmitter(view: EditorView, getDocument: GetDocument) {
  interface Events {
    init: (oldSelection?: Selection) => void;
    initCollabState: (obj: {
      getDocumentResponse: UnPromisify<ReturnType<GetDocument>>;
      oldSelection?: Selection;
    }) => void;
    error: (error: CollabError) => void;
    stateIsReady: (managerId: string) => void;
  }
  const emitter: StrictEventEmitter<Emitter, Events> = new Emitter();

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
          // We are breaking into two steps, so that in case the view was destroyed
          // or there was a networking error, 'initCollabState' will not be invoked.
          emitter.emit('initCollabState', {
            getDocumentResponse: payload,
            oldSelection,
          });
        },
        (error: CollabError) => {
          error.from = 'init';
          emitter.emit('error', error);
        },
      );
    })
    .on('initCollabState', ({ getDocumentResponse, oldSelection }) => {
      const { doc, version, managerId } = getDocumentResponse;

      const prevSelection =
        view.state.selection instanceof TextSelection
          ? view.state.selection
          : undefined;

      let tr = replaceDocument(view.state, doc, version);
      const selection = oldSelection || prevSelection;
      if (selection) {
        let { from } = selection;
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
      emitter.emit('stateIsReady', managerId);
      return;
    });

  return emitter;
}
