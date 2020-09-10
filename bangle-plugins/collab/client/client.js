import { Step } from 'prosemirror-transform';

import {
  receiveTransaction,
  sendableSteps,
  getVersion,
} from 'prosemirror-collab';
import { cancelablePromise } from 'bangle-core/utils/js-utils';
import { CollabError } from '../collab-error';

const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};

class State {
  edit;
  comm;
  constructor(edit, comm) {
    this.edit = edit;
    this.comm = comm;
  }
}

export class EditorConnection {
  state = new State(null, 'start');
  backOff = 0;
  request = null;
  handlers;
  schema;
  docName;

  static defaultOpts = {
    recoveryBackOffInterval: 200,
  };

  constructor(docName, handlers, userId, opts = {}) {
    this.docName = docName;
    this.userId = userId;
    this.opts = {
      ...EditorConnection.defaultOpts,
      ...opts,
    };
    this.handlers = {
      getDocument: handlers.getDocument,
      pullEvents: handlers.pullEvents,
      pushEvents: handlers.pushEvents,
      createEditorState: handlers.createEditorState,
      updateState: handlers.updateState,
      onDispatchTransaction: handlers.onDispatchTransaction,
      destroyView: handlers.destroyView,
    };
    this.start(docName);
    this.log = (...args) => {
      log(`userId: ${this.userId}`, ...args);
    };
  }

  dispatchTransaction = (transaction) => {
    this.dispatch({ type: 'transaction', transaction });
  };

  dispatch = async (action) => {
    let newEditState = null;

    if (action.type === 'loaded') {
      let editState = await this.handlers.createEditorState(
        action.doc,
        action.version,
      );
      this.state = new State(editState, 'poll');
      this.poll();
      if (editState && !this.loaded) {
        this.handlers.updateState(this.state.edit);
        this.handlers.onDispatchTransaction(this.dispatchTransaction);
      }
    } else if (action.type === 'restart') {
      this.state = new State(null, 'start');
      this.start(this.docName);
    } else if (action.type === 'poll') {
      this.state = new State(this.state.edit, 'poll');
      this.poll();
    } else if (action.type === 'recover') {
      if (action.error.errorCode && action.error.errorCode < 500) {
        console.error(action.error);
        this.state = new State(null, null);
      } else {
        this.state = new State(this.state.edit, 'recover');
        this.recover(action.error);
      }
    } else if (action.type === 'transaction') {
      newEditState = this.state.edit.apply(action.transaction);
    }

    if (newEditState) {
      let sendable;
      if (newEditState.doc.content.size > 40000) {
        if (this.state.comm !== 'detached') {
          console.error('Document too big. Detached.');
        }
        this.state = new State(newEditState, 'detached');
      } else if (
        (this.state.comm === 'poll' || action.requestDone) &&
        (sendable = this.sendable(newEditState))
      ) {
        this.closeRequest();
        this.state = new State(newEditState, 'send');
        this.send(newEditState, sendable);
      } else if (action.requestDone) {
        this.state = new State(newEditState, 'poll');
        this.poll();
      } else {
        this.state = new State(newEditState, this.state.comm);
      }
    }

    // Sync the editor with this.state.edit
    if (this.state.edit) {
      if (this.loaded) {
        this.handlers.updateState(this.state.edit);
      } else {
        this.loaded = true;
      }
    } else {
      // todo change this to this.close()
      this.handlers.destroyView();
      this.loaded = false;
    }
  };

  run(promise) {
    this.request = cancelablePromise(Promise.resolve(promise));
    return this.request;
  }

  // Poll is meant to be kept in a state where the request is pending
  // and resolved whenever the server responds. So the client.js will eagerly
  // call this and wait for it to finish whenever it feels like.
  poll() {
    this.log('poll started', this.state.comm);
    this.run(
      this.handlers.pullEvents({
        version: getVersion(this.state.edit),
        docName: this.docName,
      }),
    ).promise.then(
      async (data) => {
        this.log('success polling ', Math.random(), this.state);
        this.backOff = 0;
        if (data.steps && data.steps.length) {
          let tr = receiveTransaction(
            this.state.edit,
            data.steps.map((j) => Step.fromJSON(this.state.edit.schema, j)),
            data.clientIDs,
          );

          this.dispatch({
            type: 'transaction',
            transaction: tr,
            requestDone: true,
          });
        } else {
          this.poll();
        }
      },
      (err) => {
        if (err.isCanceled) {
          return;
        }

        if (!(err instanceof CollabError)) {
          console.log('Not a collab error');
        }

        if (err.errorCode === 410 || badVersion(err)) {
          // Too far behind. Revert to server state
          console.error(err);
          this.log('poll: bad version', this.state.comm);
          this.dispatch({ type: 'restart' });
          return;
        }

        this.log('poll: recover', this.state.comm);
        this.dispatch({ type: 'recover', error: err });
      },
    );
  }

  start(docName) {
    this.run(this.handlers.getDocument({ docName })).promise.then(
      (data) => {
        this.log('start:success', this.state.comm);
        this.backOff = 0;
        this.dispatch({
          type: 'loaded',
          doc: data.doc,
          version: data.version,
        });
      },
      (err) => {
        if (!(err instanceof CollabError)) {
          throw err;
        }
        console.error(err);
      },
    );
  }

  // Try to recover from an error
  recover(err) {
    this.clearBackOffTimeout();
    let newBackOff = this.backOff
      ? Math.min(this.backOff * 2, 6e4)
      : this.opts.recoveryBackOffInterval;

    if (newBackOff > 1000 && this.backOff < 1000) {
      this.log('recover backing off', this.state.comm);
      console.error(err);
    }
    this.backOff = newBackOff;
    this.backOffTimeout = setTimeout(() => {
      if (this.state.comm === 'recover') {
        this.dispatch({ type: 'poll' });
      }
    }, this.backOff);
  }

  send(editState, sendable) {
    const { steps } = sendable;
    const payload = {
      version: getVersion(editState),
      steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
      clientID: steps ? steps.clientID : 0,
    };

    this.run(this.handlers.pushEvents(payload, this.docName)).promise.then(
      (data) => {
        this.log('send:success', this.state.comm);
        this.backOff = 0;
        let tr;
        try {
          tr = steps
            ? receiveTransaction(
                this.state.edit,
                steps.steps,
                repeat(steps.clientID, steps.steps.length),
              )
            : this.state.edit.tr;
        } catch (err) {
          // TODO do we need this?
          console.error(err);
          this.log('err when receving transaction', this.state.comm);
          this.dispatch({ type: 'recover', error: err });
          return;
        }
        this.dispatch({
          type: 'transaction',
          transaction: tr,
          requestDone: true,
        });
      },
      (err) => {
        if (err.isCanceled) {
          return;
        }

        if (!(err instanceof CollabError)) {
          throw err;
        }

        if (err.errorCode === 409) {
          this.log('send:err 409, polling', err.errorCode, this.state);
          // The client's document conflicts with the server's version.
          // Poll for changes and then try again.
          this.backOff = 0;
          this.dispatch({ type: 'poll' });
        } else if (badVersion(err)) {
          console.error(err);
          this.log('send:err bad version, restarting', this.state.comm);
          this.dispatch({ type: 'restart' });
        } else {
          console.error(err);
          this.log('send:err other error, recovering', this.state.comm);
          this.dispatch({ type: 'recover', error: err });
        }
      },
    );
  }

  sendable(editState) {
    let steps = sendableSteps(editState);
    if (steps) {
      return { steps };
    }
  }

  closeRequest() {
    if (this.request) {
      this.request.cancel();
      this.request = null;
    }
  }

  clearBackOffTimeout() {
    if (this.backOffTimeout) {
      clearTimeout(this.backOffTimeout);
      this.backOffTimeout = null;
    }
  }

  close() {
    this.closeRequest();
    this.clearBackOffTimeout();
    this.handlers.destroyView();
    this.loaded = false;
  }
}

function badVersion(err) {
  return err.errorCode === 400 && /invalid version/i.test(err);
}

function repeat(val, n) {
  let result = [];
  for (let i = 0; i < n; i++) {
    result.push(val);
  }
  return result;
}
