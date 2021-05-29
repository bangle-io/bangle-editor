import { GetDocument, PullEvents, PushEvents } from './types';

const LOG = false;
let log = LOG
  ? console.log.bind(console, 'collab/collab-request-handlers')
  : () => {};

export const collabRequestHandlers = (
  sendRequest: any,
): {
  getDocument: GetDocument;
  pullEvents: PullEvents;
  pushEvents: PushEvents;
} => ({
  async getDocument({ docName, userId }) {
    log({ docName, userId });
    return sendRequest('get_document', {
      docName,
      userId,
    });
  },

  async pullEvents({ version, docName, userId }) {
    log({ version, docName, userId });
    return sendRequest('pull_events', {
      docName,
      version,
      userId,
    });
  },

  async pushEvents({ version, steps, clientID, docName, userId }) {
    log({ version, steps, clientID, docName, userId });
    return sendRequest('push_events', {
      clientID,
      version,
      steps,
      docName,
      userId,
    });
  },
});
