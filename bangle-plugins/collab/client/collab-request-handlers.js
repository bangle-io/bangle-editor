export const collabRequestHandlers = (sendRequest) => ({
  getDocument: async ({ docName, userId }) => {
    return sendRequest('get_document', {
      docName,
      userId,
    });
  },

  pullEvents: async ({ version, docName, userId }) => {
    return sendRequest('get_events', {
      docName,
      version,
      userId,
    });
  },

  pushEvents: async ({ version, steps, clientID, docName, userId }) => {
    return sendRequest('push_events', {
      clientID,
      version,
      steps,
      docName,
      userId,
    });
  },
});
