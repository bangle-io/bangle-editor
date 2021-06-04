import type { Disk } from '@bangle.dev/collab-server';
import type { Node } from 'prosemirror-model';
import debounceFn, { DebouncedFunction } from 'debounce-fn';

const LOG = true;

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
  async _doSave(docName: string, doc: Node) {
    log(docName, '_doSaveDoc  called');
    await this.setItem(docName, doc);
    this.pendingWrites.delete(docName);
  }

  constructor(
    private getItem: (key: string) => Promise<Node>,
    private setItem: (key: string, doc: Node) => Promise<void>,
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

  async load(docName: string) {
    let item = await this.getItem(docName);
    return item;
  }

  async flush(docName: string, doc: Node) {
    log(docName, 'flush doc called');
    this.pendingWrites.add(docName);
    // clear the timeout so that we do not
    // overwrite the doc due to the timeout
    const existingFn = this.debounceFuncs.get(docName);
    if (existingFn) {
      existingFn.cancel();
      this.debounceFuncs.delete(docName);
    }
    this._doSave(docName, doc);
  }

  async update(docName: string, getLatestDoc: () => Node) {
    let existingFn = this.debounceFuncs.get(docName);
    this.pendingWrites.add(docName);
    if (!existingFn) {
      existingFn = debounceFn(
        () => {
          this.debounceFuncs.delete(docName);
          this._doSave(docName, getLatestDoc());
        },
        { wait: this.debounceWait, maxWait: this.debounceMaxWait },
      );
      this.debounceFuncs.set(docName, existingFn);
    }

    existingFn();
  }

  async flushAll() {
    console.log('Flushing data');
    Array.from(this.debounceFuncs.values()).map((r) => r());
  }
}

class WatchSet<T> extends Set<T> {
  constructor(private onSizeChange = (size: number) => {}) {
    super();
    this.onSizeChange(this.size);
  }
  add(entry: T) {
    const result = super.add(entry);
    this.onSizeChange(this.size);
    return result;
  }
  clear() {
    const result = super.clear();
    this.onSizeChange(this.size);
    return result;
  }
  delete(entry: T) {
    const result = super.delete(entry);
    this.onSizeChange(this.size);
    return result;
  }
}
