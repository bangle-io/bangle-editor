import type { Node } from '@bangle.dev/pm';
import { DebouncedFunction, debounceFn } from '@bangle.dev/utils';

import { Disk } from './Disk';

const LOG = false;

export { Disk };

let log = LOG ? console.log.bind(console, 'disk') : () => {};

/**
 * A simple storage utility function for saving data
 * into browsers storage.
 */
export class DebouncedDisk implements Disk {
  debounceWait;
  debounceMaxWait;
  debounceFuncs = new Map<string, DebouncedFunction<any, any>>();
  pendingWrites: WatchSet<string>;
  constructor(
    // return undefined if document is not found
    private _getItem: (key: string) => Promise<Node | undefined>,
    private _setItem: (
      key: string,
      doc: Node,
      version: number,
    ) => Promise<void>,
    {
      debounceWait = 300,
      debounceMaxWait = 1000,
      onPendingWrites,
    }: {
      debounceWait: number;
      debounceMaxWait: number;
      // is called whenever there is a change in number of pending writes
      // the param represents the current number of documents pending with write.
      onPendingWrites?: (size: number) => void;
    },
  ) {
    this.debounceWait = debounceWait;
    this.debounceMaxWait = debounceMaxWait;
    this.pendingWrites = new WatchSet(onPendingWrites);
  }

  async flush(docName: string, doc: Node, version: number) {
    log(docName, 'flush doc called');
    this.pendingWrites.add(docName);
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    const existingFn = this.debounceFuncs.get(docName);
    if (existingFn) {
      existingFn.cancel();
      this.debounceFuncs.delete(docName);
    }
    this._doSave(docName, doc, version);
  }

  async flushAll() {
    Array.from(this.debounceFuncs.values()).map((r) => r());
  }

  async load(docName: string) {
    let item = await this._getItem(docName);
    return item;
  }

  async update(
    docName: string,
    getLatestDoc: () => { doc: Node; version: number },
  ) {
    let existingFn = this.debounceFuncs.get(docName);
    this.pendingWrites.add(docName);
    if (!existingFn) {
      existingFn = debounceFn(
        () => {
          this.debounceFuncs.delete(docName);
          const { doc, version } = getLatestDoc();
          this._doSave(docName, doc, version);
        },
        { wait: this.debounceWait, maxWait: this.debounceMaxWait },
      );
      this.debounceFuncs.set(docName, existingFn);
    }

    existingFn();
  }

  async _doSave(docName: string, doc: Node, version: number) {
    log(docName, '_doSaveDoc  called');
    await this._setItem(docName, doc, version);
    this.pendingWrites.delete(docName);
  }
}

class WatchSet<T> extends Set<T> {
  constructor(private _onSizeChange = (size: number) => {}) {
    super();
    this._onSizeChange(this.size);
  }

  add(entry: T) {
    const result = super.add(entry);
    this._onSizeChange(this.size);
    return result;
  }

  clear() {
    const result = super.clear();
    this._onSizeChange(this.size);
    return result;
  }

  delete(entry: T) {
    const result = super.delete(entry);
    this._onSizeChange(this.size);
    return result;
  }
}
