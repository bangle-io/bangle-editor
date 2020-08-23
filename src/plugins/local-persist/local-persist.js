import { PluginKey, Plugin } from 'prosemirror-state';
import { Extension } from '../../utils/bangle-utils';
import { LocalDisk } from './local-disk';
import { LocalInstance } from './local-instance';
import { Step } from 'prosemirror-transform';
import {
  collab,
  sendableSteps,
  getVersion,
  receiveTransaction,
} from 'prosemirror-collab';

export class LocalClient extends Extension {
  get name() {
    return 'local_persist_ext';
  }

  get defaultOptions() {
    return {
      version: 0,
      clientID: Math.floor(Math.random() * 0xffffffff),
      debounce: 250,
      onSendable: ({ editor, sendable }) => {
        const result = this.localServer.pushEvents(
          sendable,
          this.options.initDoc.name,
          1,
        );
        if (result === -1) {
          console.log('received -1');
          this.pullEvents();
        }
      },
      update: ({ version, steps, clientIDs, users }) => {
        const { state, view, schema } = this.editor;
        if (getVersion(state) > version) {
          console.log(
            `current version${getVersion(
              state,
            )} greater than received ${version}`,
          );
          return;
        }

        console.log('received new version' + version);

        view.dispatch(
          receiveTransaction(
            state,
            steps.map((step) => Step.fromJSON(schema, step)),
            clientIDs,
          ),
        );
      },
    };
  }

  async pullEvents() {
    const events = await this.localServer.pullEvents(
      this.options.initDoc.name,
      1,
      getVersion(this.editor.state),
    );
    this.options.update(events);
  }

  init() {
    this.editor.on('init', () => {
      this.localServer = new LocalServer(
        this.editor.schema,
        this.options.initDoc,
      );
      //   setInterval(async () => {
      //     try {
      //       this.pullEvents();
      //     } catch (err) {
      //       if (/invalid version/i.test(err)) {
      //         this.restart();
      //       }
      //       throw err;
      //     }
      //   }, 1000);
    });

    this.getSendableSteps = debounce((state) => {
      const sendable = sendableSteps(state);

      if (sendable) {
        this.options.onSendable({
          editor: this.editor,
          sendable: {
            version: sendable.version,
            steps: sendable.steps.map((step) => step.toJSON()),
            clientID: sendable.clientID,
          },
        });
      }
    }, this.options.debounce);

    this.editor.on('transaction', ({ state }) => {
      this.getSendableSteps(state);
    });
  }

  async restart() {
    const inst = this.localServer.getInstance(this.options.initDoc.name, 1);
    // throw 5;
    this.options.forceUpdateContent(inst.doc, inst.version);
    // this.editor.updateState({ doc: schema.nodeFromJSON(data.doc) });
  }

  get plugins() {
    return [
      collab({
        version: this.options.version,
        clientID: this.options.clientID,
      }),
    ];
  }
}

class LocalServer {
  constructor(schema, initDoc) {
    this.schema = schema;
    this.localPersist = new LocalPersist(schema, initDoc);
  }

  getInstances() {
    return this.localPersist.instanceInfo();
  }

  getInstance(id, ipAddress) {
    let inst = this.localPersist.getInstance(id, ipAddress);
    return {
      doc: inst.doc.toJSON(),
      users: inst.userCount,
      version: inst.version,
    };
  }

  async pullEvents(id, ipAddress, version) {
    version = nonNegInteger(version);

    let inst = this.localPersist.getInstance(id, ipAddress);
    let data = inst.getEvents(version);
    if (data === false) {
      throw new Error('History no longer available');
    }
    // If the server version is greater than the given version,
    // return the data immediately.
    if (data.steps.length) {
      return this._outputEvents(inst, data);
    }

    console.log('reached this weird state');
    return new Promise((resolve, rej) => {
      // If the server version matches the given version,
      // wait until a new version is published to return the event data.
      let wait = new Waiting(inst, ipAddress, () => {
        if (wait.send()) {
          resolve(this._outputEvents(inst, inst.getEvents(version)));
        } else {
          rej();
        }
      });
      inst.waiting.push(wait);
    });
  }

  pushEvents(data, id, ipAddress) {
    let version = nonNegInteger(data.version);
    let steps = data.steps.map((s) => Step.fromJSON(this.schema, s));
    let result = this.localPersist
      .getInstance(id, ipAddress)
      .addEvents(version, steps, data.clientID);

    if (!result) {
      console.log('Version not current', version);

      return -1;
    }

    return result;
  }

  _outputEvents(inst, data) {
    return {
      version: inst.version,
      steps: data.steps.map((s) => s.toJSON()),
      clientIDs: data.steps.map((step) => step.clientID),
      users: data.users,
    };
  }
}

class LocalPersist {
  constructor(schema, initDoc) {
    this.schema = schema;
    this.instances = Object.create(null);
    this.instanceCount = 0;
    this.maxCount = 20;
    this.localDisk = new LocalDisk(this.instances, (prop, obj) =>
      this._newInstance(prop, schema.nodeFromJSON(obj.doc)),
    );
  }

  _newInstance(id, doc) {
    if (++this.instanceCount > this.maxCount) {
      let oldest = null;
      for (let id in this.instances) {
        let inst = this.instances[id];
        if (!oldest || inst.lastActive < oldest.lastActive) oldest = inst;
      }
      this.instances[oldest.id].stop();
      delete this.instances[oldest.id];
      --this.instanceCount;
    }
    this.instances[id] = new LocalInstance(
      id,
      doc,
      this.schema,
      this.localDisk.scheduleSave,
    );

    return this.instances[id];
  }

  instanceInfo() {
    let found = [];
    for (let id in this.instances)
      found.push({ id: id, users: this.instances[id].userCount });
    return found;
  }

  getInstance(id, ip) {
    let inst = this.instances[id] || this._newInstance(id);
    if (ip) inst.registerUser(ip);
    inst.lastActive = Date.now();
    return inst;
  }
}

function nonNegInteger(str) {
  let num = Number(str);
  if (!isNaN(num) && Math.floor(num) == num && num >= 0) return num;
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
    this.finish = finish;
    this.done = false;
    setTimeout(1000 * 60 * 5, () => {
      this.abort();
      this.send();
    });
  }

  abort() {
    let found = this.inst.waiting.indexOf(this);
    if (found > -1) this.inst.waiting.splice(found, 1);
  }

  send() {
    if (this.done) return null;
    this.done = true;
    return true;
  }
}

function debounce(fn, delay) {
  let timeout;
  return function (...args) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      fn(...args);
      timeout = null;
    }, delay);
  };
}
