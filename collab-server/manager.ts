import { Step } from 'prosemirror-transform';
import { objectMapValues, serialExecuteQueue, raceTimeout } from './utils';
import { Instance, StepBigger } from './instance';
import { CollabError } from './collab-error';
import { Schema, Node } from 'prosemirror-model';

const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};

export class Manager {
  instanceCount = 0;
  maxCount = 20;
  instances: { [key: string]: Instance } = {};
  getDocumentQueue = serialExecuteQueue<Instance>();

  routes;
  disk;
  cleanUpInterval?: number = undefined;
  collectUsersTimeout;
  interceptRequests?: (path: string, payload: any) => void;

  constructor(
    private schema: Schema,
    {
      disk = {
        load: async (_docName: string): Promise<any> => {},
        update: async (_docName: string, _cb: () => Node) => {},
        flush: async (_docName: string, _doc: Node) => {},
      },
      userWaitTimeout = 7 * 1000,
      collectUsersTimeout = 5 * 1000,
      instanceCleanupTimeout = 10 * 1000,
      interceptRequests = undefined, // useful for testing or debugging
    } = {},
  ) {
    this._getInstanceQueued = this._getInstanceQueued.bind(this);
    this.disk = disk;
    this.collectUsersTimeout = collectUsersTimeout;
    this.interceptRequests = interceptRequests;
    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this.routes = generateRoutes(
      schema,
      this._getInstanceQueued,
      userWaitTimeout,
    );

    if (instanceCleanupTimeout > 0) {
      this.cleanUpInterval = setInterval(
        () => this._cleanup(),
        instanceCleanupTimeout,
      );
    }
  }

  _stopInstance(docName: string) {
    const instance = this.instances[docName];
    if (instance) {
      log('stopping instances', instance.docName);
      instance.stop();
      delete this.instances[docName];
      --this.instanceCount;
    }
  }

  _cleanup() {
    log('Cleaning up');
    const instances = Object.values(this.instances);
    for (const i of instances) {
      if (i.userCount === 0) {
        this._stopInstance(i.docName);
      }
    }
  }

  destroy() {
    log('destroy called');
    // todo need to abort `get_events` pending requests
    for (const i of Object.values(this.instances)) {
      this._stopInstance(i.docName);
    }
    if (this.cleanUpInterval) {
      clearInterval(this.cleanUpInterval);
      this.cleanUpInterval = undefined;
    }
  }

  async _newInstance(docName: string, doc?: Node) {
    log('creating new instance', docName);
    const { instances } = this;
    let created;
    if (!doc) {
      let rawDoc = await this.disk.load(docName);
      doc = this.schema.nodeFromJSON(rawDoc);
      // in case the doc was newly created save it
      this.disk.flush(docName, doc);
    }

    if (++this.instanceCount > this.maxCount) {
      let oldest = null;
      for (let inst of Object.values(instances)) {
        if (!oldest || inst.lastActive < oldest.lastActive) {
          oldest = inst;
        }
      }
      if (oldest) {
        this._stopInstance(oldest.docName);
      }
    }
    const scheduleSave = (final?: boolean): void => {
      const instance = instances[docName];
      if (!instance) {
        return;
      }
      final
        ? this.disk.flush(docName, instance.doc)
        : this.disk.update(docName, () => instance.doc);
    };

    return (instances[docName] = new Instance(
      docName,
      this.schema,
      doc,
      scheduleSave,
      created,
      this.collectUsersTimeout,
    ));
  }

  async handleRequest(path: string, payload: any) {
    if (!this.routes[path]) {
      throw new Error('Path not found');
    }

    if (!payload.userId) {
      throw new Error('Must have user id');
    }

    if (this.interceptRequests) {
      await this.interceptRequests(path, payload);
    }

    log(`request to ${path} from `, payload.userId);
    const route: any = this.routes[path];
    return route(payload);
  }

  async _getInstanceQueued(docName: string, userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.getDocumentQueue.add(async () => {
      let inst = this.instances[docName] || (await this._newInstance(docName));
      if (userId) {
        inst.registerUser(userId);
      }
      inst.lastActive = Date.now();
      return inst;
    });
  }
}

function nonNegInteger(str: any) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) {
    return num;
  }

  throw new CollabError(400, 'Not a non-negative integer: ' + str);
}

// Object that represents an HTTP response.
class Output {
  responded: boolean = false;
  constructor(public body: OutputData) {}

  static outputEvents(inst: Instance, data: any) {
    return Output.json({
      version: inst.version,
      steps: data.steps.map((step: StepBigger) => step.toJSON()),
      clientIDs: data.steps.map((step: StepBigger) => step.clientID),
      users: data.users,
    });
  }

  static json(data: OutputData) {
    return new Output(data);
  }

  resp() {
    if (this.responded) {
      throw new Error('already responded');
    }
    this.responded = true;
    return { body: this.body };
  }
}

interface OutputData {
  doc?: { [key: string]: any };
  // TODO users cannot be a number lol
  users?: number;
  version?: number;
  steps?: Array<{ [key: string]: any }>;
  clientIDs?: string[];
}

function generateRoutes(
  schema: Schema,
  getInstance: (
    docName: string,
    userId: string,
  ) => Promise<Instance | undefined>,
  userWaitTimeout: number,
) {
  const routes = {
    get_document: async ({
      docName,
      userId,
    }: {
      docName: string;
      userId: string;
    }) => {
      log('get_document', { docName, userId });

      let inst = await getInstance(docName, userId);
      // TODO better propogating of these errors
      if (!inst) {
        throw new Error('Instance not found');
      }
      return Output.json({
        doc: inst.doc.toJSON(),
        users: inst.userCount,
        version: inst.version,
      });
    },

    get_events: async ({
      docName,
      version,
      userId,
    }: {
      docName: string;
      version: number;
      userId: string;
    }) => {
      // An endpoint for a collaborative document instance which
      // returns all events between a given version and the server's
      // current version of the document.
      version = nonNegInteger(version);

      let instance = await getInstance(docName, userId);

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
        return Output.outputEvents(instance, data);
      }
      // If the server version matches the given version,
      // wait until a new version is published to return the event data.

      // TODO we need to expose this abort in case the client themself
      // decide to close the get_events request.
      let abort;

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

      try {
        await raceTimeout(waitForChanges, userWaitTimeout);
        log('finished');
        return Output.outputEvents(instance, instance.getEvents(version));
      } catch (err) {
        if (err.timeout === true) {
          log('timeout aborting');
          if (abort) {
            // TODO fix this
            (abort as any)();
          }
          return Output.json({});
        }
        throw err;
      }
    },

    push_events: async ({
      clientID,
      version,
      steps,
      docName,
      userId,
    }: {
      clientID: string;
      steps: any[];
      docName: string;
      version: number;
      userId: string;
    }) => {
      version = nonNegInteger(version);
      steps = steps.map((s) => Step.fromJSON(schema, s));
      const instance = await getInstance(docName, userId);
      if (!instance) {
        throw new Error('Instance not found');
      }
      log('received version =', version, 'server version', instance.version);
      let result = instance.addEvents(version, steps, clientID);

      if (!result) {
        throw new CollabError(
          409,
          `Version ${version} not current. Currently on ${instance.version}`,
        );
      } else {
        return Output.json(result);
      }
    },
  };

  function mapRoutes<T>(routes: {
    [key: string]: (...args: T[]) => Promise<Output>;
  }) {
    return objectMapValues(routes, (route) => {
      return async (...args: T[]) => {
        let result = await route(...args);
        return result.resp();
      };
    });
  }

  return mapRoutes(routes);
}
