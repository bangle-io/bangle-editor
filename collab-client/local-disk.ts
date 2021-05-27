import { Disk } from './disk';
import { Node } from 'prosemirror-model';

const LOG = false;

let log = LOG ? console.log.bind(console, 'persistence/disk') : () => {};

/**
 * A simple storage utility function for saving data
 * into browsers storage.
 */
export class LocalDisk extends Disk {
  _saveTimeout: number | null = null;
  _getItem;
  _setItem;
  _saveDebounce;
  _pendingTimers: { [key: string]: () => void } = {};
  async _doSave(docName: string, doc: Node) {
    log(docName, '_doSaveDoc  called');

    this._saveTimeout = null;

    await this._setItem(docName, doc);
  }

  constructor(
    {
      getItem,
      setItem,
    }: {
      getItem: (key: string) => Promise<any>;
      setItem: (key: string, doc: Node) => Promise<void>;
    },
    { saveDebounce = 2000 } = {},
  ) {
    super();
    this._getItem = getItem;
    this._setItem = setItem;
    this._saveTimeout = null;
    this._saveDebounce = saveDebounce;
  }

  async load(docName: string) {
    let item = await this._getItem(docName);
    return item;
  }

  async flush(docName: string, doc: Node) {
    log(docName, 'flush doc called');
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    if (this._saveTimeout) {
      clearTimeout(this._saveTimeout);
      this._saveTimeout = null;
    }

    this._doSave(docName, doc);
  }

  async update(docName: string, getLatestDoc: () => Node) {
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
