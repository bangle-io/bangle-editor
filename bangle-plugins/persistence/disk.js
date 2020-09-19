import { simpleLRU } from 'bangle-core/utils/js-utils';

const LOG = false;

let log = LOG ? console.log.bind(console, 'persistence/disk') : () => {};

export class Disk {
  constructor({ db, defaultDoc, saveEvery = 2000, lruSize = 10 }) {
    this.myMainDisk = new LocalDisk({ db, defaultDoc, saveEvery, lruSize });
  }

  // if doc does not exist create it
  async getDoc(key) {
    return this.myMainDisk.getDoc(key);
  }

  async updateDoc(key, getLatestDoc) {
    return this.myMainDisk.updateDoc(key, getLatestDoc);
  }

  async flushDoc(key, doc) {
    return this.myMainDisk.flushDoc(key, doc);
  }
}

class LocalDisk {
  constructor({ db, defaultDoc, saveEvery, lruSize }) {
    this._db = db;
    this._defaultDoc = defaultDoc;
    this._memory = simpleLRU(lruSize);
    this._saveTimeout = null;
    this._saveEvery = saveEvery;
    this._pendingTimers = {};
  }

  async flushAll() {
    console.log('Flushing data');
    const promises = Object.values(this._pendingTimers).map((r) => r());
    await Promise.all(promises);
  }

  async getDoc(docName) {
    let item = await this._db.getItem(docName);

    if (item) {
      // saving created date
      this._memory.set(docName, item.created);

      return item.doc;
    }

    return this._defaultDoc;
  }

  async flushDoc(docName, doc) {
    log(docName, 'flush doc called');
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    this._doSaveDoc(docName, doc);
    this._memory.remove(docName);
  }

  async updateDoc(docName, getLatestDoc) {
    const exists = this._pendingTimers[docName];
    if (exists) {
      log(docName, 'timeout already exists');
      return;
    }

    const timeout = setTimeout(() => {
      log(docName, 'timeout calling callback');
      callback();
    }, this._saveEvery);

    const callback = async () => {
      log(docName, 'callback');
      await this._doSaveDoc(docName, getLatestDoc());
      delete this._pendingTimers[docName];
      clearTimeout(timeout);
    };

    this._pendingTimers[docName] = callback;
  }

  async _doSaveDoc(docName, doc) {
    log(docName, '_doSaveDoc doc called');

    this._saveTimeout = null;

    let inMemory = this._memory.get(docName);

    let item = {
      docName: docName,
      title: doc.firstChild?.textContent || docName,
      doc: doc.toJSON(),
      modified: Date.now(),
      created: inMemory || Date.now(),
      version: 1,
    };

    this._memory.set(docName, item.created);

    await this._db.setItem(docName, item);
  }
}
