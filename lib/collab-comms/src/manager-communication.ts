import { CollabMessageBus, MessageType } from './collab-message-bus';
import { CollabRequest, CollabRequestType } from './common';

export class ManagerCommunication {
  constructor(
    managerId: string,
    private readonly _collabMessageBus: CollabMessageBus,
    handleRequest: (
      body: CollabRequest['request'],
      uid?: string,
    ) => Promise<CollabRequest['response']>,
    signal: AbortSignal,
  ) {
    const removeListener = this._collabMessageBus.receiveMessages(
      managerId,
      async (message) => {
        // handle only PING message
        // since manager needs to respond them: PING -> PONG
        if (message.type !== MessageType.PING) {
          return;
        }

        const { id, messageBody } = message;
        let requestBody: CollabRequest['request'] = messageBody || {};

        switch (requestBody.type) {
          case CollabRequestType.GetDocument:
          case CollabRequestType.PullEvents:
          case CollabRequestType.PushEvents: {
            // TODO handle error
            let response = await handleRequest(requestBody, id);
            this._collabMessageBus.transmit({
              from: managerId,
              to: message.from,
              type: MessageType.PONG,
              id: id,
              messageBody: response,
            });
            break;
          }
          default: {
            // no need to throw any error since there might be other events pushed
            // its just that they will emitted dynamically. If they are emitted statically
            // we want TS to warn us with the `: never` trick below.
            let val: never = requestBody;
          }
        }
      },
    );

    signal.addEventListener(
      'abort',
      () => {
        removeListener();
      },
      { once: true },
    );
  }

  public onNewCollabState(docName: string): void {
    // console.warn('not implemented onNewCollabState:', docName);
  }
}
