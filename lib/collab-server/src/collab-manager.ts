import { Node, Schema, Step } from '@bangle.dev/pm';
import { Either, EitherType, isTestEnv, uuid } from '@bangle.dev/utils';

import { CollabServerState, StepBigger } from './collab-state';
import {
  CollabFail,
  CollabRequest,
  CollabRequestType,
  CollabResponse,
  GetDocumentResponse,
  PullEventResponse,
  PullEventsRequestParam,
  PushEventsRequestParam,
  PushEventsResponse,
} from './common';

type ApplyState = (
  docName: string,
  newCollabState: CollabServerState,
  oldCollabState: CollabServerState,
) => boolean;

const LOG = true;

let log = (isTestEnv ? true : LOG)
  ? console.debug.bind(console, 'collab-server:')
  : () => {};

export class CollabManager {
  public readonly managerId: string;
  counter = 0;
  private _destroyed = false;
  private _instances: Map<string, Instance> = new Map();

  constructor(
    private _options: {
      managerId?: string;
      schema: Schema;
      // callback to provide the initial collaborate state
      // example: (docName) => new CollabState(fetchDoc(docName))
      getInitialState: (
        docName: string,
      ) => Promise<CollabServerState | undefined>;
      applyState?: ApplyState;
    },
  ) {
    this.managerId = _options.managerId || uuid();
  }

  public destroy() {
    this._destroyed = true;
  }

  getCollabState(docName: string): CollabServerState | undefined {
    return this._instances.get(docName)?.collabState;
  }

  async handleRequest<T extends CollabRequestType>(
    request: Extract<CollabRequest, { type: T }>,
  ): Promise<
    | { ok: false; body: CollabFail }
    | { ok: true; body: Extract<CollabResponse, { type: T }>['payload'] }
  > {
    if (!request.payload.docName) {
      throw new Error('docName is required');
    }

    let uid = this.counter++;

    log(
      `uid=${uid} userId=${request.payload.userId} received request=${request.type}, `,
    );

    const handleReq = (
      request: CollabRequest,
      instance: Instance,
    ): EitherType<
      CollabFail,
      PullEventResponse | GetDocumentResponse | PushEventsResponse
    > => {
      const { type, payload } = request;

      if (this._destroyed) {
        return Either.left(CollabFail.ManagerDestroyed);
      }

      switch (type) {
        case CollabRequestType.GetDocument: {
          return Either.right({
            doc: instance.collabState.doc.toJSON(),
            users: instance.userCount,
            version: instance.collabState.version,
            managerId: this.managerId,
          });
        }

        case CollabRequestType.PushEvents: {
          log(
            `uid=${uid} userId=${
              request.payload.userId
            } ${type} payload-steps=${JSON.stringify(payload.steps)}`,
          );

          if (this.managerId !== payload.managerId) {
            return Either.left(CollabFail.IncorrectManager);
          }

          return instance.addEvents(payload);
        }

        case CollabRequestType.PullEvents: {
          if (this.managerId !== payload.managerId) {
            return Either.left(CollabFail.IncorrectManager);
          }

          return instance.getEvents(payload);
        }

        /* istanbul ignore next*/
        default: {
          let _type: never = type;
          throw new Error('Unknown path: ' + _type);
        }
      }
    };

    const [failure, collabResponse] = Either.unwrap(
      Either.flatMap(
        await this._getInstance(request.payload.docName),
        (instance) => {
          return handleReq(request, instance);
        },
      ),
    );

    if (failure) {
      log(`uid=${uid} userId=${request.payload.userId} response=${failure}`);
      return { ok: false, body: failure };
    } else {
      log(
        `uid=${uid} userId=${request.payload.userId} response=${JSON.stringify(
          collabResponse,
        )}`,
      );
      return {
        ok: true,
        // TODO fix any
        body: collabResponse as any,
      };
    }
  }

  public isDestroyed() {
    return this._destroyed;
  }

  private async _createInstance(
    docName: string,
  ): Promise<EitherType<CollabFail, Instance>> {
    const initialCollabState = await this._options.getInitialState(docName);

    // this takes care of edge case where another instance is created
    // while we wait on `getDoc`.
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
  }: PushEventsRequestParam): EitherType<CollabFail, PushEventsResponse> {
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
  }: PullEventsRequestParam): EitherType<CollabFail, PullEventResponse> {
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
