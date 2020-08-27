import localforage from 'localforage';

const SAVE_EVERY = 14000;

localforage.config({
  name: 'bangle/1',
  version: 1.0,
});

const LOG = false;
let log = LOG ? console.log.bind(console, 'collab/server/manager') : () => {};

export class Store {
  #store = localforage.createInstance({
    name: 'local_disk',
  });

  iterate(cb) {
    return new Promise((res, rej) => {
      this.#store
        .iterate((value, key, iterationNumber) => {
          console.log({
            value,
            key,
          });
          cb(key, value);
        })
        .then(() => {
          res();
        })
        .catch((err) => {
          // This code runs if there were any errors
          console.error(err);
          rej(err);
        });
    });
  }

  async retrieve(key) {
    return this.#store.getItem(key);
  }

  putObject(key, data) {
    return this.#store.setItem(key, data);
  }
}

export class LocalDisk {
  constructor(instances) {
    this.store = new Store();
    this.saveTimeout = null;
    this.saveEvery = SAVE_EVERY;
    this.instances = instances; // TODO Disk should not be aware of instances
    this.isReady = this.store.iterate((key, value) => {});
  }

  async retrieveObject(docName) {
    let item = await this.store.retrieve(docName);

    if (item) {
      return item;
    }

    let legacyItem = await localforage.getItem(docName);
    if (legacyItem) {
      this.store.putObject(docName, {
        doc: legacyItem.content,
        docName: docName,
        title: legacyItem.title,
        created: legacyItem.created,
        modified: legacyItem.modified,
      });
      item = legacyItem;
      item.doc = legacyItem.content;
    }

    return { doc: item.doc, created: item.created };
  }

  async flush() {
    await this._doSave();
  }

  scheduleSave = () => {
    if (this.saveTimeout != null) return;
    this.saveTimeout = setTimeout(this._doSave, this.saveEvery);
  };

  _doSave = async () => {
    this.saveTimeout = null;
    for (var prop in this.instances) {
      if (this.instances[prop].doc) {
        await this.saveInstance(this.instances[prop]);
      } else {
        console.error('instance', prop, 'is undefined', this.instances[prop]);
      }
    }
  };

  async saveInstance(instance) {
    log('saving', instance.docName);
    await this.store.putObject(instance.docName, {
      doc: instance.doc.toJSON(),
      docName: instance.docName,
      title: instance.doc.firstChild?.textContent || instance.docName,
      modified: Date.now(),
      created: instance.created,
    });
  }
}
