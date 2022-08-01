import { CollabMessageBus, MessageType } from './collab-message-bus';
import {
  CollabClientRequest,
  CollabClientRequestType,
  CollabManagerBroadCast,
} from './common';
import { generateUUID } from './wrap-request';

export class ManagerCommunication {
  constructor(
    public readonly managerId: string,
    private readonly _collabMessageBus: CollabMessageBus,
    handleRequest: (
      body: CollabClientRequest['request'],
      uid?: string,
    ) => Promise<CollabClientRequest['response']>,
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
        let requestBody: CollabClientRequest['request'] = messageBody || {};

        switch (requestBody.type) {
          case CollabClientRequestType.GetDocument:
          case CollabClientRequestType.PullEvents:
          case CollabClientRequestType.PushEvents: {
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

  public broadcast(messageBody: CollabManagerBroadCast): void {
    this._collabMessageBus.transmit({
      from: this.managerId,
      to: undefined,
      type: MessageType.BROADCAST,
      id: generateUUID(),
      messageBody: messageBody,
    });
  }
}
