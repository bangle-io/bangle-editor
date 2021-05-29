import { PullEvents, PushEvents, GetDocument } from '@bangle.dev/collab-server';
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
  async getDocument(obj) {
    return sendRequest('get_document', obj);
  },

  async pullEvents(obj) {
    return sendRequest('pull_events', obj);
  },

  async pushEvents(obj) {
    return sendRequest('push_events', obj);
  },
});
