import { Editor } from 'bangle-core/index';
import { Emitter } from 'bangle-core/utils/emitter';
import {
  cancelablePromise,
  getIdleCallback,
  serialExecuteQueue,
  sleep,
} from 'bangle-core/utils/js-utils';
import {
  getVersion,
  receiveTransaction,
  sendableSteps,
} from 'prosemirror-collab';
import { Step } from 'prosemirror-transform';
import { CollabError } from '../collab-error';
import { replaceDocument, strictCheckObject } from './helpers';

const LOG = false;
export const RECOVERY_BACK_OFF = 50;
let log = LOG ? console.log.bind(console, 'collab/client2') : () => {};

export class Editor2 extends Editor {
  dispatchTransaction(transaction) {
    // const nodes = findChangedNodesFromTransaction(transaction);
    // if (nodes.length > 0) {
    // }
    const newState = this.state.apply(transaction);
    this.view.updateState(newState);
    this.selection = {
      from: this.state.selection.from,
      to: this.state.selection.to,
    };
    this.setActiveNodesAndMarks();
    this.emit('transaction', {
      getHTML: this.getHTML.bind(this),
      getJSON: this.getJSON.bind(this),
      state: this.state,
      transaction,
    });
    if (!transaction.docChanged || transaction.getMeta('preventUpdate')) {
      return;
    }

    this.emitUpdate(transaction);
  }
}

export class ParentPlug {
  destroy() {
    this._connection();
  }

  constructor(docName, handlers, editor, clientID) {
    this._docName = docName;
    this._handlers = handlers;
    this._editor = editor;
    this._view = editor.view;
    this._clientID = clientID;
    this._init();
  }

  _init() {
    this._connection = connectionManager({
      docName: this._docName,
      handlers: this._handlers,
      editor: this._editor,
      onReceiveSteps: this._onReceiveSteps,
      restart: this._restart,
    });
  }

  _restart = () => {
    this._connection();
    setTimeout(() => this._init(), 0);
  };

  _onReceiveSteps = (payload) => {
    strictCheckObject(payload, {
      steps: 'array-of-objects',
      clientIDs: 'array-of-strings',
    });

    const { clientIDs, steps } = payload;
    if (steps.length === 0) {
      log('no steps', payload);
      return false;
    }

    const tr = receiveTransaction(this._view.state, steps, clientIDs)
      .setMeta('addToHistory', false)
      .setMeta('isRemote', true);
    const newState = this._view.state.apply(tr);
    this._view.updateState(newState);
    return;
  };
}

function connectionManager({
  docName,
  handlers,
  editor,
  onReceiveSteps,
  restart,
}) {
  const view = editor.view;
  let recoveryBackOff = 0;

  const _initializeEmitter = initializeCollab(
    view,
    docName,
    handlers.getDocument,
  ).emit('initialize');

  const pullEmitter = pullEvents(view, docName, handlers.pullEvents)
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

  const pushEmitter = pushEvents(view, docName, handlers.pushEvents).on(
    'error',
    (error) => {
      onError(error);
    },
  );

  let _destroyOnTransaction;

  _initializeEmitter.on('ready', () => {
    pullEmitter.emit('pull');

    const onTransaction = ({ transaction }) => {
      if (transaction.getMeta('isRemote')) {
        log('skipping a remote txn', transaction);
        return;
      }
      pushEmitter.emit('push');
    };

    editor.on('transaction', onTransaction);
    _destroyOnTransaction = () => {
      editor.off('transaction', onTransaction);
    };
  });

  const onError = (error) => {
    const { errorCode } = error;
    console.error(error);
    if (!(error instanceof CollabError)) {
      throw error;
    }

    switch (errorCode) {
      // invalid version
      case 400:
      case 410: {
        // bad version
        console.log('restarting');
        restart();
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

  return () => {
    pullEmitter.destroy();
    pushEmitter.destroy();
    _initializeEmitter.destroy();
    _destroyOnTransaction && _destroyOnTransaction();
  };
}

/**
 *
 * A helper function to constantly poll the Authority and emit newly received steps.
 * @returns {Emitter} An emitter emits steps or error and listens for pull events
 */
export function pullEvents(view, docName, pullEvents) {
  const emitter = new Emitter();

  let cProm;

  const pull = () => {
    // Only opt for the latest pull and cancel others
    if (cProm) {
      cProm.cancel();
    }

    cProm = cancelablePromise(
      pullEvents({
        version: getVersion(view.state),
        docName: docName,
      }),
    );

    cProm.promise
      .then((data) => {
        log('pullEvents received', data);
        // TODO make sure the server responds with empty arrays
        // instead of us hotfixing it here
        const steps = data.steps ? data.steps : [];
        const clientIDs = data.clientIDs ? data.clientIDs : [];
        emitter.emit('steps', {
          steps: steps.map((j) => Step.fromJSON(view.state.schema, j)),
          clientIDs: clientIDs,
        });
      })
      .catch((err) => {
        if (err.isCanceled) {
          return;
        }
        emitter.emit('error', err);
      });
  };
  emitter.on('pull', pull);
  return emitter;
}

export function pushEvents(view, docName, pushEvents) {
  const emitter = new Emitter();
  const queue = serialExecuteQueue();

  const push = async () => {
    await queue.add(async () => {
      const steps = sendableSteps(view.state);
      if (!steps) {
        log('no steps');
        return;
      }
      // todo add some condition to only send when needed
      // If successful When pushing our own changes expect server to send an update to
      // make our changes from unconfirmed to confirmed (i.e. a version change).
      return pushEvents(
        {
          version: getVersion(view.state),
          steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
          clientID: steps ? steps.clientID : 0,
        },
        docName,
      ).catch((error) => {
        emitter.emit('error', error);
      });
    });
  };

  emitter.on('push', push);
  return emitter;
}

export function initializeCollab(view, docName, getDocument) {
  const emitter = new Emitter();

  emitter
    .on('initialize', async () => {
      getDocument({
        docName: docName,
      }).then(
        (payload) => {
          const { doc, version } = payload;
          // broken into two steps
          // in case the view was destroyed init state will
          // never be called
          emitter.emit('initialize_state', { doc, version });
        },
        (error) => {
          emitter.emit('error', error);
        },
      );
    })
    .on('initialize_state', (payload) => {
      strictCheckObject(payload, { doc: 'object', version: 'number' });
      const { doc, version } = payload;
      const tr = replaceDocument(view.state, doc, version);
      const newState = view.state.apply(
        tr.setMeta('isRemote', true).setMeta('collabClientSetup', true),
      );
      view.updateState(newState);
      view.dispatch(view.state.tr.setMeta('collabStateReady', true));
      emitter.emit('ready');
      return;
    });

  return emitter;
}
