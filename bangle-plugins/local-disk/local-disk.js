import { Disk } from '../collab/client/disk';

const LOG = false;

let log = LOG ? console.log.bind(console, 'persistence/disk') : () => {};

/**
 * A simple storage utility function for saving data
 * into browsers storage.
 */
export class LocalDisk extends Disk {
  async _doSave(docName, doc) {
    log(docName, '_doSaveDoc  called');

    this._saveTimeout = null;

    await this._setItem(docName, doc.toJSON());
  }

  /**
   *
   * @param {{getItem: (key) => Promise<Object>, setItem: (key, doc) => Promise<void>}} - Callback methods to make a call to save the data.
   * @param {Object} options
   */
  constructor({ getItem, setItem }, { defaultDoc, saveDebounce = 2000 }) {
    super();
    this._getItem = getItem;
    this._setItem = setItem;
    this._defaultDoc = defaultDoc;
    this._saveTimeout = null;
    this._saveDebounce = saveDebounce;
    this._pendingTimers = {};
  }

  async load(docName) {
    let item = await this._getItem(docName);
    return item;
  }

  async flush(docName, doc) {
    log(docName, 'flush doc called');
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    this._doSave(docName, doc);
  }

  async update(docName, getLatestDoc) {
    const exists = this._pendingTimers[docName];
    if (exists) {
      log(docName, 'timeout already exists');
      return;
    }

    const timeout = setTimeout(() => {
      log(docName, 'timeout calling callback');
      callback();
    }, this._saveDebounce);

    const callback = async () => {
      log(docName, 'callback');
      await this._doSave(docName, getLatestDoc());
      delete this._pendingTimers[docName];
      clearTimeout(timeout);
    };

    this._pendingTimers[docName] = callback;
  }

  async flushAll() {
    console.log('Flushing data');
    const promises = Object.values(this._pendingTimers).map((r) => r());
    await Promise.all(promises);
  }
}
