import { Node, Schema, Step } from '@bangle.dev/pm';
import { Either, EitherType, isTestEnv, uuid } from '@bangle.dev/utils';

import { CollabState, StepBigger } from './collab-state';
import {
  CollabFail,
  CollabRequestType,
  GetDocumentResponse,
  ManagerRequest,
  ManagerResponse,
  PullEventResponse,
  PullEventsRequestParam,
  PushEventsRequestParam,
  PushEventsResponse,
} from './common';

type ApplyEvents = (
  newCollabState: CollabState,
  oldCollabState: CollabState,
) => boolean;

const LOG = true;

let log = (isTestEnv ? false : LOG)
  ? console.debug.bind(console, 'collab-server:')
  : () => {};

export class CollabManager {
  public readonly managerId = uuid();
  counter = 0;
  private _instances: Map<string, Instance> = new Map();

  constructor(
    private _options: {
      schema: Schema;
      getDoc: (docName: string) => Promise<Node | undefined>;
      applyCollabState?: ApplyEvents;
    },
  ) {}

  getCollabState(docName: string): CollabState | undefined {
    return this._instances.get(docName)?.collabState;
  }

  async handleRequest2<T extends CollabRequestType>(
    request: Extract<ManagerRequest, { type: T }>,
  ): Promise<
    | { ok: false; body: CollabFail }
    | { ok: true; body: Extract<ManagerResponse, { type: T }>['payload'] }
  > {
    if (!request.payload.docName) {
      throw new Error('docName is required');
    }
    let uid = this.counter++;

    const handleReq = (
      request: ManagerRequest,
      instance: Instance,
    ): EitherType<
      CollabFail,
      PullEventResponse | GetDocumentResponse | PushEventsResponse
    > => {
      const { type, payload } = request;
      switch (type) {
        case 'get_document': {
          return Either.right({
            doc: instance.collabState.doc.toJSON(),
            users: instance.userCount,
            version: instance.collabState.version,
            managerId: this.managerId,
          });
        }

        case 'push_events': {
          if (this.managerId !== payload.managerId) {
            return Either.left(CollabFail.IncorrectManager);
          }

          return instance.addEvents(payload);
        }

        case 'pull_events': {
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
      return { ok: false, body: failure };
    } else {
      log({ uid, request, userId: request.payload.userId }, collabResponse);
      return {
        ok: true,
        // TODO fix any
        body: collabResponse as any,
      };
    }
  }

  private async _createInstance(
    docName: string,
  ): Promise<EitherType<CollabFail, Instance>> {
    const doc = await this._options.getDoc(docName);

    // this takes care of edge case where another instance is created
    // while we wait on `getDoc`.
    let instance = this._instances.get(docName);

    if (instance) {
      return Either.right(instance);
    }

    if (!doc) {
      return Either.left(CollabFail.DocumentNotFound);
    }

    const initialCollabState = new CollabState(doc, [], 0);

    instance = new Instance(
      docName,
      this._options.schema,
      initialCollabState,
      this._options.applyCollabState,
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
    private _collabState: CollabState,
    private _applyCollabState: ApplyEvents = (
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
  }: PushEventsRequestParam): EitherType<CollabFail, PushEventsResponse> {
    this.lastActive = Date.now();

    let version = nonNegInteger(rawVersion);

    if (version === undefined) {
      return Either.left(CollabFail.InvalidVersion);
    }

    const parsedSteps = steps.map((s) => Step.fromJSON(this.schema, s));

    return Either.flatMap(
      CollabState.addEvents(this._collabState, version, parsedSteps, clientID),
      (collabState) => {
        if (this._applyCollabState(collabState, this._collabState)) {
          this._collabState = collabState;
        } else {
          return Either.left(CollabFail.ApplyFailed);
        }

        // Instance.sendUpdates(this.waiting);
        // this._saveData();

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
      CollabState.getEvents(this._collabState, version),
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
