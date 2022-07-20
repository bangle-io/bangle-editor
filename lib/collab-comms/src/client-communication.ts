import { CollabMessageBus, MessageType } from './collab-message-bus';
import {
  CollabClientRequest,
  CollabClientRequestGetDocument,
  CollabClientRequestPullEvents,
  CollabClientRequestPushEvents,
  CollabClientRequestType,
  CollabFail,
  CollabManagerBroadCast,
  CollabManagerBroadCastType,
  CollabManagerNewVersion,
  NetworkingError,
} from './common';
import { wrapRequest } from './wrap-request';

type MakeRequest<R extends CollabClientRequest> = (
  body: R['request']['body'],
) => Promise<R['response']>;

export class ClientCommunication {
  public getDocument: MakeRequest<CollabClientRequestGetDocument> = (body) => {
    let request = {
      type: CollabClientRequestType.GetDocument as const,
      body,
    };
    return this._wrapRequest(CollabClientRequestType.GetDocument, request);
  };

  public pullEvents: MakeRequest<CollabClientRequestPullEvents> = (body) => {
    const request: CollabClientRequestPullEvents['request'] = {
      type: CollabClientRequestType.PullEvents,
      body,
    };
    return this._wrapRequest(CollabClientRequestType.PullEvents, request);
  };

  public pushEvents: MakeRequest<CollabClientRequestPushEvents> = (body) => {
    const request: CollabClientRequestPushEvents['request'] = {
      type: CollabClientRequestType.PushEvents,
      body,
    };
    return this._wrapRequest(CollabClientRequestType.PushEvents, request);
  };

  public managerId: string;

  constructor(
    private _opts: {
      clientId: string;
      managerId: string;
      messageBus: CollabMessageBus;
      signal: AbortSignal;
      requestTimeout?: number;
      docName: string;
      onNewVersion: (body: CollabManagerNewVersion['body']) => void;
    },
  ) {
    this.managerId = this._opts.managerId;

    const removeListener = this._opts.messageBus?.receiveMessages(
      this._opts.clientId,
      (message) => {
        if (
          message.type !== MessageType.BROADCAST &&
          message.from !== this.managerId
        ) {
          return;
        }

        const messageBody = message.messageBody as CollabManagerBroadCast;
        const { type } = messageBody;

        // ignore any message that is not for the current doc
        if (messageBody.body.docName !== this._opts.docName) {
          return;
        }

        switch (type) {
          case CollabManagerBroadCastType.NewVersion: {
            this._opts.onNewVersion(messageBody.body);
            return;
          }
          default: {
            let val: never = type;
            throw new Error(`Unknown message type: ${messageBody.type}`);
          }
        }
      },
    );

    this._opts.signal.addEventListener(
      'abort',
      () => {
        removeListener();
      },
      { once: true },
    );
  }

  private async _wrapRequest<T extends CollabClientRequestType>(
    type: T,
    request: Extract<CollabClientRequest, { type: T }>['request'],
  ): Promise<
    | Extract<CollabClientRequest, { type: T }>['response']
    | {
        body: CollabFail;
        type: T;
        ok: false;
      }
  > {
    try {
      return (await wrapRequest(request, {
        from: this._opts.clientId,
        to: this.managerId,
        emitter: this._opts.messageBus,
        requestTimeout: this._opts.requestTimeout,
      })) as any;
    } catch (error) {
      if (error instanceof Error) {
        const message = error.message as NetworkingError;
        switch (message) {
          case NetworkingError.Timeout: {
            return {
              body: CollabFail.ManagerUnresponsive,
              type,
              ok: false,
            };
          }
          default: {
            let val: never = message;
            throw error;
          }
        }
      }
      throw error;
    }
  }
}
