import localforage from 'localforage';

const SAVE_EVERY = 14000;

localforage.config({
  name: 'bangle/1',
  version: 1.0,
});

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
          console.log('Iteration has completed');
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
  constructor(instances, newInstance) {
    this.store = new Store();
    this.saveTimeout = null;
    this.saveEvery = SAVE_EVERY;
    this.instances = instances;
    this.newInstance = newInstance;
    // TODO i dont think we need to create all instances
    // instead we should do that on demand
    this.isReady = this.store.iterate((key, value) => {
      // this.newInstance(key, value);
    });
  }

  async retrieveObject(key) {
    let item = await this.store.retrieve(key);

    if (item) {
      return item;
    }

    let legacyItem = await localforage.getItem(key);
    if (legacyItem) {
      this.store.putObject(key, {
        doc: legacyItem.content,
        uid: key,
        title: legacyItem.title,
        created: legacyItem.created,
        modified: legacyItem.modified,
      });
      item = legacyItem;
      item.doc = legacyItem.content;
    }

    return { doc: item.doc, created: item.created };
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
    await this.store.putObject(instance.id, {
      doc: instance.doc.toJSON(),
      uid: instance.id,
      title: instance.doc.firstChild?.textContent || instance.id,
      modified: Date.now(),
      created: instance.created,
    });
  }
}
