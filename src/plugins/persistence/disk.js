import {
  simpleLRU,
  getIdleCallback,
} from '../../utils/bangle-utils/utils/js-utils';

const LOG = true;

let log = LOG ? console.log.bind(console, 'persistence/disk') : () => {};

export class Disk {
  constructor({ db, defaultDoc, saveEvery = 500, lruSize = 5 }) {
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
  }

  async getDoc(docName) {
    let item = await this._db.getItem(docName);

    if (item) {
      // saving doc as undefined because item.doc is a json and not a PM doc
      this._memory.set(docName, { created: item.created, doc: undefined });

      return item.doc;
    }

    return this._defaultDoc;
  }

  async flushDoc(docName, doc) {
    log('flush doc called');
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    this._doSaveDoc(docName, doc);
    this._memory.remove(docName);
  }

  // TODO right now this will clear any save request of other docName
  // making it not save older docs
  async updateDoc(docName, getLatestDoc) {
    if (this._saveTimeout != null) return;

    this._saveTimeout = setTimeout(() => {
      getIdleCallback(() => this._doSaveDoc(docName, getLatestDoc()));
    }, this._saveEvery);
  }

  async _doSaveDoc(docName, doc) {
    log(docName, '_doSaveDoc doc called');

    this._saveTimeout = null;

    let inMemory = this._memory.get(docName);

    if (inMemory?.doc && doc.eq(inMemory.doc)) {
      log(docName, 'same document');
      return;
    }

    let item = {
      docName: docName,
      title: doc.firstChild?.textContent || docName,
      doc: doc.toJSON(),
      modified: Date.now(),
      created: inMemory?.created || Date.now(),
      version: 1,
    };

    this._memory.set(docName, { created: item.created, doc });

    await this._db.setItem(docName, item);
  }
}
