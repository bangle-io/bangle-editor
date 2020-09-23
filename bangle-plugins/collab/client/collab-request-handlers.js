const LOG = false;
let log = LOG
  ? console.log.bind(console, 'collab/collab-request-handlers')
  : () => {};

export const collabRequestHandlers = (sendRequest) => ({
  async getDocument({ docName, userId }) {
    log({ docName, userId });
    return sendRequest('get_document', {
      docName,
      userId,
    });
  },

  async pullEvents({ version, docName, userId }) {
    log({ version, docName, userId });
    return sendRequest('get_events', {
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
