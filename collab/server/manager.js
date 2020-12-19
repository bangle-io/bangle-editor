import { Step } from '@banglejs/core/prosemirror/transform';
import {
  objectMapValues,
  serialExecuteQueue,
  raceTimeout,
} from '@banglejs/core/utils/js-utils';
import { Instance } from './instance';
import { CollabError } from '../collab-error';
const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};
export class Manager {
  constructor(schema, opts = {}) {
    this._getInstanceQueued = this._getInstanceQueued.bind(this);
    this.instanceCount = 0;
    this.maxCount = 20;
    this.instances = {};
    this.getDocumentQueue = serialExecuteQueue();
    this.defaultOpts = {
      disk: {
        load: async () => {},
        update: async () => {},
        flush: async () => {},
      },
      // the time interval for which the get_events is kept to wait for any new changes, after this time it will abort the connect expecting the client to make another request
      userWaitTimeout: 7 * 1000,
      collectUsersTimeout: 5 * 1000,
      instanceCleanupTimeout: 10 * 1000,
      interceptRequests: undefined, // useful for testing or debugging
    };
    this.opts = { ...this.defaultOpts, ...opts };
    this.schema = schema;
    this.disk = this.opts.disk;
    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this.routes = generateRoutes(
      schema,
      this._getInstanceQueued,
      this.opts.userWaitTimeout,
    );

    if (this.opts.instanceCleanupTimeout > 0) {
      this.cleanUpInterval = setInterval(
        () => this._cleanup(),
        this.opts.instanceCleanupTimeout,
      );
    }
  }

  _stopInstance(docName) {
    const instance = this.instances[docName];
    log(
      'stopping instancess',
      instance.docName,
      instance.doc.firstChild && instance.doc.firstChild.textContent,
    );
    this.instances[docName].stop();
    delete this.instances[docName];
    --this.instanceCount;
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
      this.cleanUpInterval = null;
    }
  }

  async _newInstance(docName, doc) {
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
      for (let id in instances) {
        let inst = instances[id];
        if (!oldest || inst.lastActive < oldest.lastActive) {
          oldest = inst;
        }
      }
      this._stopInstance(oldest.docName);
    }
    return (instances[docName] = new Instance({
      docName,
      doc,
      schema: this.schema,
      scheduleSave: (final) => {
        const instance = instances[docName];
        final
          ? this.disk.flush(docName, instance.doc)
          : this.disk.update(docName, () => instance.doc);
      },
      created,
      collectUsersTimeout: this.opts.collectUsersTimeout,
    }));
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

  async _getInstanceQueued(docName, userId) {
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

function nonNegInteger(str) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) {
    return num;
  }

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

function generateRoutes(schema, getInstance, userWaitTimeout) {
  const routes = {
    get_document: async ({ docName, userId }) => {
      log('get_document', { docName, userId });

      let inst = await getInstance(docName, userId);
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

      let inst = await getInstance(docName, userId);
      let data = inst.getEvents(version);
      if (data === false) {
        throw new CollabError(410, 'History no longer available');
      }
      // If the server version is greater than the given version,
      // return the data immediately.
      if (data.steps.length) {
        return Output.outputEvents(inst, data);
      }
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

          if (found > -1) {
            inst.waiting.splice(found, 1);
          }
          abort = null;
        };
      });

      try {
        await raceTimeout(waitForChanges, userWaitTimeout);
        log('finished');
        return Output.outputEvents(inst, inst.getEvents(version, null));
      } catch (err) {
        if (err.timeout === true) {
          log('timeout aborting');
          if (abort) {
            abort();
          }
          return Output.json({});
        }
        throw err;
      }
    },

    push_events: async ({ clientID, version, steps, docName, userId }) => {
      version = nonNegInteger(version);
      steps = steps.map((s) => Step.fromJSON(schema, s));
      const instance = await getInstance(docName, userId);
      log('recevied version =', version, 'server version', instance.version);
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

  return objectMapValues(routes, (route) => {
    return async (...args) => {
      let result = await route(...args);
      if (!(result instanceof Output)) {
        throw new Error('Only output allow');
      }
      return result.resp();
    };
  });
}
