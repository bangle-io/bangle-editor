import { Schema, Step } from '@bangle.dev/pm';
import { Either, EitherType, isTestEnv } from '@bangle.dev/utils';

import { CollabMessageBus } from './collab-event-emitter';
import { CollabServerState, StepBigger } from './collab-state';
import {
  CollabFail,
  CollabRequest,
  CollabRequestGetDocument,
  CollabRequestPullEvents,
  CollabRequestPushEvents,
  CollabRequestType,
  MANAGER_ID,
  PullEventsRequestBody,
  PullEventsResponse,
  PushEventsRequestBody,
  PushEventsResponse,
} from './common';
import { ManagerCommunication } from './manager-communication';

type ApplyState = (
  docName: string,
  newCollabState: CollabServerState,
  oldCollabState: CollabServerState,
) => boolean;

export type HandleRequest = (
  body: CollabRequest['request'],
  uid?: string,
) => Promise<CollabRequest['response']>;

const LOG = true;

let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, 'collab-server:')
  : () => {};

export class CollabManager {
  public readonly managerId: string;
  private readonly _abortController = new AbortController();
  private _handleRequest: HandleRequest = async (request, id) => {
    // TODO Add validation of request
    // if (!request.body.docName) {
    //   throw new Error('docName is required');
    // }

    log(
      `id=${id} userId=${request.body.userId} received request=${request.type}, `,
    );

    switch (request.type) {
      case CollabRequestType.GetDocument: {
        return this._handleGetDocument(request, id);
      }
      case CollabRequestType.PullEvents: {
        return this._handlePullEvents(request, id);
      }
      case CollabRequestType.PushEvents: {
        return this._handlePushEvents(request, id);
      }
      default: {
        let val: never = request;
        throw new Error('Unknown request type');
      }
    }
  };

  private readonly _instances: Map<string, Instance> = new Map();
  private readonly _serverCom?: ManagerCommunication;

  constructor(
    private _options: {
      applyState?: ApplyState;
      // callback to provide the initial collaborate state
      // example: (docName) => new CollabState(fetchDoc(docName))
      getInitialState: (
        docName: string,
      ) => Promise<CollabServerState | undefined>;

      collabMessageBus: CollabMessageBus;
      managerId?: string;
      schema: Schema;
    },
  ) {
    this.managerId = _options.managerId || MANAGER_ID;

    if (_options.collabMessageBus) {
      this._serverCom = new ManagerCommunication(
        this.managerId,
        _options.collabMessageBus,
        this._handleRequest,
        this._abortController.signal,
      );
    }
  }

  public destroy() {
    this._abortController.abort();
  }

  getAllDocNames(): Set<string> {
    return new Set(this._instances.keys());
  }

  getCollabState(docName: string): CollabServerState | undefined {
    return this._instances.get(docName)?.collabState;
  }

  public isDestroyed() {
    return this._abortController.signal.aborted;
  }

  // removes collab state entry associated with docName
  removeCollabState(docName: string): void {
    this._instances.delete(docName);
  }

  private async _createInstance(
    docName: string,
  ): Promise<EitherType<CollabFail, Instance>> {
    const initialCollabState = await this._options.getInitialState(docName);

    // this takes care of edge case where another instance is created
    // while we wait on `getInitialState`.
    let instance = this._instances.get(docName);

    if (instance) {
      return Either.right(instance);
    }

    if (!initialCollabState) {
      return Either.left(CollabFail.DocumentNotFound);
    }

    instance = new Instance(
      docName,
      this._options.schema,
      initialCollabState,
      this._options.applyState,
    );
    this._instances.set(docName, instance);

    return Either.right(instance);
  }

  /**
   * Get an instance of a document or creates a new one
   * if none exists.
   * @param docName
   * @returns
   */
  private async _getInstance(docName: string) {
    const instance = this._instances.get(docName);

    if (instance) {
      instance.lastActive = Date.now();
      return Either.right(instance);
    }

    return this._createInstance(docName);
  }

  private async _handleGetDocument(
    request: CollabRequestGetDocument['request'],
    uid?: string,
  ): Promise<CollabRequestGetDocument['response']> {
    const work = (instance: Instance) => {
      return {
        doc: instance.collabState.doc.toJSON(),
        users: instance.userCount,
        version: instance.collabState.version,
        managerId: this.managerId,
      };
    };

    return this._toResponse(
      Either.map(await this._getInstance(request.body.docName), work),
      request.type,
    );
  }

  private async _handlePullEvents(
    request: CollabRequestPullEvents['request'],
    uid?: string,
  ): Promise<CollabRequestPullEvents['response']> {
    const work = (instance: Instance) => {
      if (this.managerId !== request.body.managerId) {
        return Either.left(CollabFail.IncorrectManager);
      }

      return instance.getEvents(request.body);
    };

    return this._toResponse(
      Either.flatMap(await this._getInstance(request.body.docName), work),
      request.type,
    );
  }

  private async _handlePushEvents(
    request: CollabRequestPushEvents['request'],
    uid?: string,
  ): Promise<CollabRequestPushEvents['response']> {
    const work = (instance: Instance) => {
      const { type, body } = request;

      log(
        `uid=${uid} userId=${
          body.userId
        } ${type} payload-steps=${JSON.stringify(body.steps)}`,
      );

      if (this.managerId !== body.managerId) {
        return Either.left(CollabFail.IncorrectManager);
      }

      const result = instance.addEvents(body);

      if (Either.isRight(result)) {
        queueMicrotask(() => {
          this._serverCom?.onNewCollabState(body.docName, instance.collabState);
        });
      }
      return result;
    };

    return this._toResponse(
      Either.flatMap(await this._getInstance(request.body.docName), work),
      request.type,
    );
  }

  private _toResponse<R, P extends CollabRequestType>(
    val: EitherType<CollabFail, R>,
    requestType: P,
  ) {
    if (Either.isLeft(val)) {
      return {
        ok: false as const,
        body: val.left,
        type: requestType,
      };
    } else {
      return {
        ok: true as const,
        body: val.right,
        type: requestType,
      };
    }
  }
}

class Instance {
  public lastActive = Date.now();

  constructor(
    public readonly docName: string,
    private readonly schema: Schema,
    private _collabState: CollabServerState,
    private _applyState: ApplyState = (
      docName,
      newCollabState,
      oldCollabState,
    ) => {
      return true;
    },
  ) {}

  get collabState() {
    return this._collabState;
  }

  // TODO add userCount
  get userCount(): number {
    return 1;
  }

  public addEvents({
    clientID,
    version: rawVersion,
    steps,
    userId,
    docName,
  }: PushEventsRequestBody): EitherType<CollabFail, PushEventsResponse> {
    this.lastActive = Date.now();

    let version = nonNegInteger(rawVersion);

    if (version === undefined) {
      return Either.left(CollabFail.InvalidVersion);
    }

    const parsedSteps = steps.map((s) => Step.fromJSON(this.schema, s));

    return Either.flatMap(
      CollabServerState.addEvents(
        this._collabState,
        version,
        parsedSteps,
        clientID,
      ),
      (collabState) => {
        if (this._applyState(docName, collabState, this._collabState)) {
          this._collabState = collabState;
        } else {
          return Either.left(CollabFail.ApplyFailed);
        }

        return Either.right({
          empty: null,
        });
      },
    );
  }

  public getEvents({
    docName,
    version,
    userId,
    managerId,
  }: PullEventsRequestBody): EitherType<CollabFail, PullEventsResponse> {
    return Either.map(
      CollabServerState.getEvents(this._collabState, version),
      (events) => {
        return {
          version: events.version,
          steps: events.steps.map((step: StepBigger) => step.toJSON()),
          clientIDs: events.steps.map((step: StepBigger) => step.clientID),
          users: this.userCount, // TODO
        };
      },
    );
  }
}

function nonNegInteger(str: any): number | undefined {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) {
    return num;
  }
  return undefined;
}
