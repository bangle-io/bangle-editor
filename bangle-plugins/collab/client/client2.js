import { Step } from 'prosemirror-transform';
import { Editor } from 'bangle-core/index';

import {
  receiveTransaction,
  sendableSteps,
  getVersion,
} from 'prosemirror-collab';
import { repeatValue, replaceDocument, strictCheckObject } from './helpers';
import { serialExecuteQueue } from 'bangle-core/utils/js-utils';
const LOG = true;

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

export class ClientPlug {
  destroy() {
    this._editor.off('transaction', this._sendUpdate);
  }

  constructor(docName, handlers, editor, clientID) {
    this._docName = docName;
    this._clientID = clientID;
    this._editor = editor;
    this._view = editor.view;
    this._handlers = {
      pushEvents: handlers.pushEvents,
      pullEvents: handlers.pullEvents,
      getDocument: handlers.getDocument,
    };

    this._setup();
    this._editor.on('transaction', this._sendUpdate);
    this._sendUpdateQueue = serialExecuteQueue();
  }

  _sendUpdate = async ({ transaction }) => {
    if (transaction.getMeta('isRemote')) {
      log('skipping a remote txn', transaction);
      return;
    }

    this._sendUpdateQueue.add(async () => {
      await sendSteps(
        this._view,
        this._docName,
        this._handlers.pushEvents,
      ).catch((error) => {
        return this._handleCollabError(error);
      });
    });
  };

  async _setup() {
    const { doc, version } = await this._handlers.getDocument({
      docName: this._docName,
    });

    const tr = replaceDocument(this._view.state, doc, version);

    tr.setMeta('isRemote', true);
    tr.setMeta('collabClientSetup', true);
    const newState = this._view.state.apply(tr);
    log('setup', newState);
    this._view.updateState(newState);
    const newTr = this._view.state.tr;
    this._view.dispatch(newTr.setMeta('collabStateReady', true));
    this._poll();
  }

  async _reset() {
    this._setup();
  }

  _poll = () => {
    this._handlers
      .pullEvents({
        version: getVersion(this._view.state),
        docName: this._docName,
      })
      .then((data) => {
        log('poll success', data);
        if (data.steps?.length > 0) {
          return receiveUpdate(this._view, {
            steps: data.steps.map((j) =>
              Step.fromJSON(this._view.state.schema, j),
            ),
            clientIDs: data.clientIDs,
          });
        }
      })
      .then(() => {
        this._poll();
        window.poll = this._poll;
      });
  };

  _handleCollabError(error) {
    log('Handling error', error);
    const { errorCode } = error;

    switch (errorCode) {
      case 400: // invalid version
      case 410: {
        // bad version
        this._reset();
        return;
      }
      default: {
        console.log({ errorCode });
        console.error(error);
        throw new Error('Unknown error');
      }
    }
  }
}

function receiveUpdate(view, payload) {
  log('receiving update', payload);
  const { steps } = payload;
  strictCheckObject(payload, {
    steps: 'array-of-objects',
    clientIDs: 'array-of-strings',
  });

  if (!steps || steps.length === 0) {
    return false;
  }

  let tr = receiveTransaction(view.state, steps, payload.clientIDs);

  const { selection } = view.state;
  const { from, to } = selection;
  const [firstStep] = steps;

  // preserve the selection if it happens to be right on the first step
  if (from === firstStep.from && to === firstStep.to) {
    tr.setSelection(selection);
  }

  tr.setMeta('addToHistory', false);
  tr.setMeta('isRemote', true);

  // TODO: should I dispatch the TR or directly apply it.
  //   const newState = view.state.apply(tr);
  //   view.updateState(newState);
  view.dispatch(tr);
}

async function sendSteps(view, docName, pushEvents) {
  const steps = sendableSteps(view.state);
  if (!steps) {
    console.log('no steps');
    return;
  }

  // add some condition to only send when needed
  const payload = {
    version: getVersion(view.state),
    steps: steps ? steps.steps.map((s) => s.toJSON()) : [],
    clientID: steps ? steps.clientID : 0,
  };

  console.log('sending', payload.version, payload);

  // If successful When pushing our own changes expect server to send an update to
  // make our changes from unconfirmed to confirmed (i.e. a version change).
  return pushEvents(payload, docName);
}
