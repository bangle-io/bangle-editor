import { Step } from 'prosemirror-transform';
import {
  cancelablePromise,
  sleep,
  objectMapValues,
  handleAsyncError,
  serialExecuteQueue,
} from '../../../utils/bangle-utils/utils/js-utils';
import { Instance } from './instance';
import { LocalDisk } from './disk';
// import PQueue from 'p-queue';
const LOG = false;

let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};

export class Manager {
  instanceCount = 0;
  maxCount = 20;
  constructor(schema) {
    this.schema = schema;
    this.instances = {};
    window.instances = this.instances;
    this.localDisk = new LocalDisk(this.instances, (prop, obj) => {
      // this._newInstance(prop, schema.nodeFromJSON(obj.doc)),
      console.log(prop);
    });
    this.routes = objectMapValues(this.routes, ([key, value]) => {
      return handle(value);
    });
    // Queue is very important
    // to prevent parallel requests from creating deadlock
    // for example two requests parallely comming and creating two new instances of the same doc
    this.getDocumentQueue = serialExecuteQueue();
    // this.getDocumentQueue =  new PQueue({ concurrency: 1 });

    this.cleanup = () => {
      // TODO this is not ideal we shouldnt have so many timers
      // everythign should be stateless dry plugggable
      const instances = Object.values(this.instances);
      if (instances.length <= 1) {
        return;
      }
      Object.values(this.instances).forEach((i) => {
        if (i.userCount === 0) {
          log('shutting down ', i.doc.firstChild?.textContent);
          this.localDisk.saveInstance(i).then(() => {
            i.stop();
            i.waiting.forEach((z) => z.abort());
            delete this.instances[i.id];
          });
        }
      });
    };
    // window.cleanups = this.cleanup;
    setInterval(this.cleanup, 5000);
  }

  async handleRequest(path, payload) {
    if (!this.routes[path]) {
      throw new Error('Path not found');
    }
    if (Object.values(payload).some((r) => r == null)) {
      throw new Error('undefined payload for ' + path);
    }
    log(`request to ${path} from `, payload.userId);
    return this.routes[path](payload);
  }

  async _newInstance(docName, doc) {
    log('creating new instance', docName);
    const { instances } = this;
    let created;
    if (!doc) {
      let saved = await this.localDisk.retrieveObject(docName);
      if (saved) {
        doc = this.schema.nodeFromJSON(saved.doc);
        created = saved.created;
      }
    }
    if (++this.instanceCount > this.maxCount) {
      let oldest = null;
      for (let id in instances) {
        let inst = instances[id];
        if (!oldest || inst.lastActive < oldest.lastActive) oldest = inst;
      }
      instances[oldest.id].stop();
      delete instances[oldest.id];
      --this.instanceCount;
    }
    return (instances[docName] = new Instance(
      docName,
      doc,
      this.schema,
      this.localDisk.scheduleSave,
      created,
    ));
  }

  // do not use directly! use queued version
  async __getInstance(docName, ip) {
    await this.localDisk.isReady;
    let inst = this.instances[docName] || (await this._newInstance(docName));
    if (ip) inst.registerUser(ip);
    inst.lastActive = Date.now();
    return inst;
  }

  async _getInstanceQueued(docName, ip) {
    return this.getDocumentQueue.add(() => this.__getInstance(docName, ip));
  }

  routes = {
    get_documents: () => {
      throw new Error('not implemented');
    },

    get_document: async ({ docName, userId }) => {
      nullyObj({ docName, userId });

      let inst = await this._getInstanceQueued(docName, userId);
      return Output.json({
        doc: inst.doc.toJSON(),
        users: inst.userCount,
        version: inst.version,
      });
    },

    get_events: async ({ docName, version, userId }) => {
      nullyObj({ docName, version, userId });
      // An endpoint for a collaborative document instance which
      // returns all events between a given version and the server's
      // current version of the document.
      version = nonNegInteger(version);

      let inst = await this._getInstanceQueued(docName, userId);
      let data = inst.getEvents(
        version,
        // commentVersion
      );
      if (data === false) return new Output(410, 'History no longer available');
      // If the server version is greater than the given version,
      // return the data immediately.
      if (data.steps.length) return outputEvents(inst, data);
      // If the server version matches the given version,
      // wait until a new version is published to return the event data.
      return new Promise((res) => {
        let wait = new Waiting(inst, userId, () => {
          res(wait.send(outputEvents(inst, inst.getEvents(version, null))));
        });

        inst.waiting.push(wait);
      });
    },

    push_events: async ({ clientID, version, steps, docName, userId }) => {
      nullyObj({ clientID, version, steps, docName, userId });
      version = nonNegInteger(version);
      steps = steps.map((s) => Step.fromJSON(this.schema, s));
      let result = (await this._getInstanceQueued(docName, userId)).addEvents(
        version,
        steps,
        clientID,
      );
      if (!result) return new Output(409, 'Version not current');
      else return Output.json(result);
    },
  };
}

function nonNegInteger(str) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) === num && num >= 0) return num;
  let err = new Error('Not a non-negative integer: ' + str);
  err.status = 400;
  throw err;
}

// An object to assist in waiting for a collaborative editing
// instance to publish a new version before sending the version
// event data to the client.
class Waiting {
  constructor(inst, ip, finish) {
    this.inst = inst;
    this.ip = ip;
    // called by instance.js
    this.finish = finish;
    this.done = false;
    this.timer = cancelablePromise(sleep(1000 * 30));
    this.timer.promise.then(
      () => {
        this.abort();
        log('Waiting finsihed sending empty');
        this.send(Output.json({}));
      },
      (err) => {
        if (err.isCanceled) {
          log('Waiting timer canceled');
          return;
        }
        throw err;
      },
    );
  }

  abort() {
    let found = this.inst.waiting.indexOf(this);
    if (found > -1) this.inst.waiting.splice(found, 1);
  }

  send(output) {
    if (this.done) return;
    this.timer.cancel();
    this.done = true;
    return output;
  }
}

function outputEvents(inst, data) {
  return Output.json({
    version: inst.version,
    steps: data.steps.map((s) => s.toJSON()),
    clientIDs: data.steps.map((step) => step.clientID),
    users: data.users,
  });
}

// Object that represents an HTTP response.
class Output {
  constructor(code, body) {
    this.code = code;
    this.body = body;
    this.responded = false;
  }

  static json(data) {
    return new Output(200, JSON.stringify(data));
  }

  // Write the response.
  resp() {
    if (this.responded) {
      throw new Error('already responded');
    }
    log('responding');
    this.responded = true;
    return { body: this.body, code: this.code };
  }
}

function handle(fn) {
  return handleAsyncError(
    async (...args) => {
      let result = await fn(...args);
      if (!(result instanceof Output)) {
        throw new Error('Only output allow');
      }
      return result.resp();
    },
    (err) => {
      console.error(err);
      let error = new Error(err.body || err.message);
      error.status = err.status || 500;
      throw error;
    },
  );
}

function nullyObj(obj) {
  if (Object.values(obj).some((r) => r == null)) {
    console.log(obj);
    throw new Error('undefined values');
  }
}
