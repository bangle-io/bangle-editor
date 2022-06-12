import { Schema, Step } from '@bangle.dev/pm';

import { CollabError } from './collab-error';
import { Instance, StepBigger } from './instance';
import {
  GetDocumentRequestParam,
  GetDocumentResponse,
  PullEventRequestParam,
  PullEventResponse,
  PushEventsRequestParam,
  PushEventsResponse,
} from './types';

const LOG = false;

const log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};
export class CollabRequestHandler {
  constructor(
    private getInstance: (docName: string, userId: string) => Promise<Instance>,
    private userWaitTimeout: number,
    private schema: Schema,
    private managerId: string,
  ) {}

  async getDocument({
    docName,
    userId,
  }: GetDocumentRequestParam): Promise<GetDocumentResponse> {
    log('get_document', { docName, userId });
    const inst = await this.getInstance(docName, userId);
    return {
      doc: inst.doc.toJSON(),
      users: inst.userCount,
      version: inst.version,
      managerId: this.managerId,
    };
  }

  async pullEvents({
    docName,
    version,
    userId,
    managerId,
  }: PullEventRequestParam): Promise<PullEventResponse> {
    log('userWaitTimeout', this.userWaitTimeout);
    this.validateManagerId(managerId);
    // An endpoint for a collaborative document instance which
    // returns all events between a given version and the server's
    // current version of the document.
    version = nonNegInteger(version);

    let instance = await this.getInstance(docName, userId);

    if (instance == null) {
      throw new Error('Instance not found');
    }

    let data = instance.getEvents(version);
    if (data === false) {
      throw new CollabError(410, 'History no longer available');
    }
    // If the server version is greater than the given version,
    // return the data immediately.
    if (data.steps.length) {
      return outputEvents(instance, data);
    }
    // If the server version matches the given version,
    // wait until a new version is published to return the event data.

    // TODO we need to expose this abort in case the client themself
    // decide to close the pull_events request.
    let abort: (() => void) | null;

    const waitForChanges = new Promise<void>((res) => {
      const inst = instance;

      if (inst == null) {
        res();
        return;
      }

      // An object to assist in waiting for a collaborative editing
      // instance to publish a new version before sending the version
      // event data to the client.
      let waiter = {
        userId,
        onFinish: () => {
          res();
        },
      };
      inst.waiting.push(waiter);
      abort = () => {
        // note instance.js removes item from the waiting array
        // before calling onFinish
        let found = inst.waiting.indexOf(waiter);
        log('in abort waiting =', inst.waiting.length);

        if (found > -1) {
          inst.waiting.splice(found, 1);
        }
        abort = null;
      };
    });

    return new Promise((resolve, reject) => {
      let timedout = false;
      let timerId = setTimeout(() => {
        timedout = true;
        log('timeout aborting');
        if (abort) {
          abort();
        }
        resolve({});
      }, this.userWaitTimeout);

      (async () => {
        try {
          await waitForChanges;
          if (!timedout) {
            clearTimeout(timerId);
            log('finished');
            let data = instance.getEvents(version);
            if (data === false) {
              throw new CollabError(410, 'History no longer available');
            } else {
              resolve(outputEvents(instance, data));
            }
          }
        } catch (error) {
          reject(error);
        }
      })();
    });
  }

  async pushEvents({
    clientID,
    version,
    steps,
    docName,
    userId,
    managerId,
  }: PushEventsRequestParam): Promise<PushEventsResponse> {
    this.validateManagerId(managerId);

    version = nonNegInteger(version);
    const parsedSteps = steps.map((s) => Step.fromJSON(this.schema, s));
    const instance = await this.getInstance(docName, userId);
    if (!instance) {
      throw new Error('Instance not found');
    }
    log('received version =', version, 'server version', instance.version);
    let result = instance.addEvents(version, parsedSteps, clientID);

    if (!result) {
      throw new CollabError(
        409,
        `Version ${version} not current. Currently on ${instance.version}`,
      );
    } else {
      return {};
    }
  }

  private validateManagerId(managerId: string) {
    // helpful when a new manager has spawned
    // this is used to signal the client to reset its state
    if (this.managerId !== managerId) {
      throw new CollabError(410, `Incorrect manager id ` + managerId);
    }
  }
}

function nonNegInteger(str: any) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) {
    return num;
  }

  throw new CollabError(400, 'Not a non-negative integer: ' + str);
}

function outputEvents(
  inst: Instance,
  data: Exclude<ReturnType<Instance['getEvents']>, false>,
) {
  return {
    version: inst.version,
    steps: data.steps.map((step: StepBigger) => step.toJSON()),
    clientIDs: data.steps.map((step: StepBigger) => step.clientID),
    users: data.users,
  };
}
