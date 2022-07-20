import {
  CollabMessageBus,
  MessageType,
  wrapRequest,
} from './collab-event-emitter';
import {
  CollabFail,
  CollabRequest2,
  CollabRequestGetDocument,
  CollabRequestPullEvents,
  CollabRequestPushEvents,
  CollabRequestType,
  MANAGER_ID,
  NetworkingError,
} from './common';

type MakeRequest<R extends CollabRequest2> = (
  body: R['request']['body'],
) => Promise<R['response']>;

export class ClientCommunication {
  public getDocument: MakeRequest<CollabRequestGetDocument> = (body) => {
    let request = {
      type: CollabRequestType.GetDocument as const,
      body,
    };
    return this._wrapRequest(CollabRequestType.GetDocument, request);
  };

  public pullEvents: MakeRequest<CollabRequestPullEvents> = (body) => {
    const request: CollabRequestPullEvents['request'] = {
      type: CollabRequestType.PullEvents,
      body,
    };
    return this._wrapRequest(CollabRequestType.PullEvents, request);
  };

  public pushEvents: MakeRequest<CollabRequestPushEvents> = (body) => {
    const request: CollabRequestPushEvents['request'] = {
      type: CollabRequestType.PushEvents,
      body,
    };
    return this._wrapRequest(CollabRequestType.PushEvents, request);
  };

  public managerId: string;

  constructor(
    private _opts: {
      clientId: string;
      managerId?: string;
      messageBus: CollabMessageBus;
      signal: AbortSignal;
      requestTimeout?: number;
    },
  ) {
    this.managerId = this._opts.managerId || MANAGER_ID;

    const removeListener = this._opts.messageBus?.receiveMessages(
      this._opts.clientId,
      (message) => {
        switch (message.type) {
          case MessageType.BROADCAST: {
            return;
          }
          case MessageType.PONG: {
            return;
          }
          case MessageType.PING: {
            return;
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

  private async _wrapRequest<T extends CollabRequestType>(
    type: T,
    request: Extract<CollabRequest2, { type: T }>['request'],
  ): Promise<
    | Extract<CollabRequest2, { type: T }>['response']
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
    } catch (e) {
      if (e instanceof Error) {
        const message = e.message as NetworkingError;
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
            throw e;
          }
        }
      }
      throw e;
    }
  }
}
