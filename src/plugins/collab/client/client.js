import { Step } from 'prosemirror-transform';

import {
  receiveTransaction,
  sendableSteps,
  getVersion,
} from 'prosemirror-collab';
import { cancelablePromise } from '../../../utils/bangle-utils/utils/js-utils';

const LOG = true;

function log(...args) {
  if (LOG) console.log('collab/client.js', ...args);
}

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

  constructor(docName, handlers) {
    this.docName = docName;
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
      if (action.error.status && action.error.status < 500) {
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
    this.run(
      this.handlers.pullEvents({
        version: getVersion(this.state.edit),
        docName: this.docName,
      }),
    ).promise.then(
      async (data) => {
        log('success polling ', Math.random());
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
        if (err.status === 410 || badVersion(err)) {
          // Too far behind. Revert to server state
          console.error(err);
          log('poll: bad version');
          this.dispatch({ type: 'restart' });
        } else if (err) {
          log('poll: recover');
          this.dispatch({ type: 'recover', error: err });
        }
      },
    );
  }

  start(docName) {
    this.run(this.handlers.getDocument({ docName })).promise.then(
      (data) => {
        log('start:success');
        this.backOff = 0;
        this.dispatch({
          type: 'loaded',
          doc: data.doc,
          version: data.version,
        });
      },
      (err) => {
        console.error(err);
      },
    );
  }

  // Try to recover from an error
  recover(err) {
    let newBackOff = this.backOff ? Math.min(this.backOff * 2, 6e4) : 200;
    if (newBackOff > 1000 && this.backOff < 1000) {
      log('recover backing off');
      console.error(err);
    }
    this.backOff = newBackOff;
    setTimeout(() => {
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
        log('send:success');
        this.backOff = 0;
        let tr = steps
          ? receiveTransaction(
              this.state.edit,
              steps.steps,
              repeat(steps.clientID, steps.steps.length),
            )
          : this.state.edit.tr;
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
        if (err.status === 409) {
          log('send:err 409, polling');
          // The client's document conflicts with the server's version.
          // Poll for changes and then try again.
          this.backOff = 0;
          this.dispatch({ type: 'poll' });
        } else if (badVersion(err)) {
          console.error(err);
          log('send:err bad version, restarting');
          this.dispatch({ type: 'restart' });
        } else {
          log('send:err other error, recovering');
          this.dispatch({ type: 'recover', error: err });
        }
      },
    );
  }

  sendable(editState) {
    let steps = sendableSteps(editState);
    if (steps) return { steps };
  }

  closeRequest() {
    if (this.request) {
      this.request.cancel();
      this.request = null;
    }
  }

  close() {
    this.closeRequest();
    this.handlers.destroyView();
    this.loaded = false;
  }
}

function badVersion(err) {
  return err.status === 400 && /invalid version/i.test(err);
}

function repeat(val, n) {
  let result = [];
  for (let i = 0; i < n; i++) result.push(val);
  return result;
}
