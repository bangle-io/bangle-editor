import { Node, Schema, Step } from '@bangle.dev/pm';
import { Either, Left, Right, uuid } from '@bangle.dev/utils';

import {
  CollabError,
  CollabFail,
  throwCollabError,
  ValidErrorCodes as ValidCollabErrorCodes,
} from '../collab-error';
import { CollabState, StepBigger } from '../take2/collab-state';
import {
  CollabRequestParam,
  CollabRequestType,
  CollabResponse,
  PullEventResponse,
  PullEventsRequestParam,
  PushEventsRequestParam,
  PushEventsResponse,
  ServerRequest,
} from '../types';

type HandleResponseOk = {
  status: 'ok';
  body: CollabResponse;
};
type HandleResponseError = {
  status: 'error';
  body: {
    message: string;
    errorCode: ValidCollabErrorCodes;
  };
};

export class Manager2 {
  public readonly managerId = uuid();
  private _instances: Map<string, Instance> = new Map();

  constructor(
    private _options: {
      schema: Schema;
      onDocChange: (
        docName: string,
        collabState: CollabState,
        prevCollabState: CollabState,
      ) => void;
      getDoc: (docName: string) => Promise<Node | undefined>;
    },
  ) {}

  getCollabState(docName: string): CollabState | undefined {
    return this._instances.get(docName)?.collabState;
  }

  public async handleRequest(
    path: CollabRequestType,
    payload: CollabRequestParam,
  ): Promise<HandleResponseError | HandleResponseOk> {
    if (!payload.docName) {
      throw new Error('docName is required');
    }

    const handleReq = (
      request: ServerRequest,
      instance: Instance,
    ): Left<CollabFail> | Right<CollabResponse> => {
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

    const instance = await this._getInstance(payload.docName);

    const requestEither = Either.flatMap(instance, (instance) => {
      // TODO fix any
      return handleReq({ type: path, payload } as any, instance);
    });

    return Either.value(
      Either.fold(
        requestEither,
        (failure) => {
          try {
            throwCollabError(failure);
          } catch (error) {
            if (error instanceof CollabError) {
              return {
                status: 'error' as const,
                body: {
                  errorCode: error.errorCode,
                  message: error.message,
                },
              };
            }
            throw error;
          }
        },
        (collabResponse) => {
          return {
            status: 'ok' as const,
            body: collabResponse,
          };
        },
      ),
    );
  }

  private async _createInstance(
    docName: string,
  ): Promise<Left<CollabFail> | Right<Instance>> {
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

    const collabState = new CollabState(doc, [], 0);

    instance = new Instance(docName, this._options.schema, collabState);
    this._instances.set(docName, instance);

    return Either.right(instance);
  }

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
    public collabState: CollabState,
  ) {}

  // TODO add userCount
  get userCount(): number {
    return 1;
  }

  public addEvents({
    clientID,
    version: rawVersion,
    steps,
  }: PushEventsRequestParam): Left<CollabFail> | Right<PushEventsResponse> {
    let version = nonNegInteger(rawVersion);

    if (version === undefined) {
      return Either.left(CollabFail.InvalidVersion);
    }

    const parsedSteps = steps.map((s) => Step.fromJSON(this.schema, s));

    return Either.map(
      CollabState.addEvents(this.collabState, version, parsedSteps, clientID),
      (collabState) => {
        this.collabState = collabState;
        // Instance.sendUpdates(this.waiting);
        // this._saveData();

        return {
          empty: null,
        };
      },
    );
  }

  public getEvents({
    docName,
    version,
    userId,
    managerId,
  }: PullEventsRequestParam): Left<CollabFail> | Right<PullEventResponse> {
    return Either.map(
      CollabState.getEvents(this.collabState, version),
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
