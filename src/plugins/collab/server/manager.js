import { Step } from 'prosemirror-transform';
import {
  sleep,
  objectMapValues,
  serialExecuteQueue,
  clearableSleep,
  raceTimeout,
} from '../../../utils/bangle-utils/utils/js-utils';
import { Instance } from './instance';
import { CollabError } from '../collab-error';
const LOG = true;

let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};

export class Manager {
  instanceCount = 0;
  maxCount = 20;
  defaultOpts = {
    disk: {
      getDoc: async () => {},
      updateDoc: async () => {},
      flushDoc: async () => {},
    },
    // the time interval for which the get_events is kept to wait for any new changes, after this time it will abort the connect expecting the client to make another request
    userWaitTimeout: 7 * 1000,
    collectUsersTimeout: 5 * 1000,
    instanceCleanupTimeout: 5 * 1000,
    interceptRequests: undefined, // useful for testing or debugging
  };
  constructor(schema, opts = {}) {
    this.opts = { ...this.defaultOpts, ...opts };
    this.schema = schema;
    this.instances = {};
    this.disk = this.opts.disk;
    this.routes = objectMapValues(this.routes, ([key, value]) => {
      return handle(value);
    });

    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this.getDocumentQueue = serialExecuteQueue();

    if (this.opts.instanceCleanupTimeout > 0) {
      setInterval(this.cleanup, this.opts.instanceCleanupTimeout);
    }
  }

  flush(instances, shutdown = false) {
    log('received flush request');
    if (!instances) {
      instances = Object.values(this.instances);
    }

    for (const i of instances) {
      log('flushing down ', i.docName, i.doc.firstChild?.textContent);
      if (shutdown) {
        i.stop();
      }
      this.disk.flushDoc(i.docName, i.doc);
    }
  }

  cleanup = () => {
    const instances = Object.values(this.instances);
    // TODO maybe donot need to do this check
    if (instances.length <= 1) {
      return;
    }
    this.flush(instances.filter((i) => i.userCount === 0));
  };

  destroy() {
    // todo need to abort `get_events` pending requests
    this.flush(Object.values(this.instances), true);
  }

  async handleRequest(path, payload) {
    if (!this.routes[path]) {
      throw new Error('Path not found');
    }

    if (!payload.userId) {
      throw new Error('Must have user id');
    }

    if (this.opts.interceptRequests) {
      await this.opts.interceptRequests(path, payload);
    }

    log(`request to ${path} from `, payload.userId);
    return this.routes[path](payload);
  }

  async _newInstance(docName, doc) {
    log('creating new instance', docName);
    const { instances } = this;
    let created;
    if (!doc) {
      let rawDoc = await this.disk.getDoc(docName);
      doc = this.schema.nodeFromJSON(rawDoc);
      // in case the doc was newly created save it
      this.disk.flushDoc(docName, doc);
    }

    if (++this.instanceCount > this.maxCount) {
      let oldest = null;
      for (let id in instances) {
        let inst = instances[id];
        if (!oldest || inst.lastActive < oldest.lastActive) oldest = inst;
      }
      instances[oldest.docName].stop();
      delete instances[oldest.docName];
      --this.instanceCount;
    }
    return (instances[docName] = new Instance({
      docName,
      doc,
      schema: this.schema,
      scheduleSave: () => {
        this.disk.updateDoc(docName, () => instances[docName].doc);
      },
      created,
      collectUsersTimeout: this.opts.collectUsersTimeout,
    }));
  }

  async _getInstanceQueued(docName, userId) {
    if (!userId) {
      throw new Error('userId is required');
    }
    return this.getDocumentQueue.add(async () => {
      let inst = this.instances[docName] || (await this._newInstance(docName));
      if (userId) inst.registerUser(userId);
      inst.lastActive = Date.now();
      return inst;
    });
  }

  routes = {
    get_document: async ({ docName, userId }) => {
      log('get_document', { docName, userId });

      let inst = await this._getInstanceQueued(docName, userId);
      return Output.json({
        doc: inst.doc.toJSON(),
        users: inst.userCount,
        version: inst.version,
      });
    },

    get_events: async ({ docName, version, userId }) => {
      // An endpoint for a collaborative document instance which
      // returns all events between a given version and the server's
      // current version of the document.
      version = nonNegInteger(version);

      let inst = await this._getInstanceQueued(docName, userId);
      let data = inst.getEvents(version);
      if (data === false) {
        throw new CollabError(410, 'History no longer available');
      }
      // If the server version is greater than the given version,
      // return the data immediately.
      if (data.steps.length) return Output.outputEvents(inst, data);
      // If the server version matches the given version,
      // wait until a new version is published to return the event data.

      // TODO we need to expose this abort in case the client themself
      // decide to close the get_events request.
      let abort;

      const waitForChanges = new Promise((res) => {
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

          if (found > -1) inst.waiting.splice(found, 1);
          abort = null;
        };
      });

      try {
        await raceTimeout(waitForChanges, this.opts.userWaitTimeout);
        log('finished');
        return Output.outputEvents(inst, inst.getEvents(version, null));
      } catch (err) {
        if (err.timeout === true) {
          log('timeout aborting');
          if (abort) abort();
          return Output.json({});
        }
        throw err;
      }
    },

    push_events: async ({ clientID, version, steps, docName, userId }) => {
      version = nonNegInteger(version);
      steps = steps.map((s) => Step.fromJSON(this.schema, s));
      let result = (await this._getInstanceQueued(docName, userId)).addEvents(
        version,
        steps,
        clientID,
      );
      if (!result) {
        throw new CollabError(409, 'Version not current');
      } else return Output.json(result);
    },
  };
}

function nonNegInteger(str) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) return num;

  throw new CollabError(400, 'Not a non-negative integer: ' + str);
}

// Object that represents an HTTP response.
class Output {
  constructor(body) {
    this.body = body;
    this.responded = false;
  }

  static outputEvents(inst, data) {
    return Output.json({
      version: inst.version,
      steps: data.steps.map((s) => s.toJSON()),
      clientIDs: data.steps.map((step) => step.clientID),
      users: data.users,
    });
  }

  static json(data) {
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

function handle(fn) {
  return async (...args) => {
    let result = await fn(...args);
    if (!(result instanceof Output)) {
      throw new Error('Only output allow');
    }
    return result.resp();
  };
}
