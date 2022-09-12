const maxNoOfPendingRecords = 100;

export class InstanceDeleteGuard {
  pendingDeleteRecord = new Map<
    string,
    {
      deleteTime: number;
      abortDelete: AbortController;
    }
  >();

  constructor(
    public opts: {
      // time to wait before deleting an instance
      deleteWaitTime: number;
      // time since create pending delete request after which the record might be removed to save memory
      maxDurationToKeepRecord: number;
    },
  ) {
    if (this.opts.deleteWaitTime >= this.opts.maxDurationToKeepRecord) {
      throw new Error(
        'deleteWaitTime must be less than maxDurationToKeepRecord',
      );
    }
  }

  addPendingDelete(docName: string, deleteCallback: () => void) {
    // if there is already a delete request pending, abort it
    this.pendingDeleteRecord.get(docName)?.abortDelete.abort();

    const abortController = new AbortController();
    this.pendingDeleteRecord.set(docName, {
      deleteTime: Date.now(),
      abortDelete: abortController,
    });

    abortableSetTimeout(
      deleteCallback,
      abortController.signal,
      this.opts.deleteWaitTime,
    );

    this.containSize();
  }

  /**
   * Guard to ensure client is not accessing an instance that is about to be deleted or is deleted
   */
  checkAccess(docName: string, clientCreatedAt: number): boolean {
    const record = this.pendingDeleteRecord.get(docName);

    if (!record) {
      return true;
    }

    // if client was created after the delete request
    // we cancel the pending delete instance request. Note that the request may have already
    // been executed, but we don't care about that.
    // we also grant access but we still keep the record around, in case an older client
    // tries to access the instance.
    if (clientCreatedAt > record.deleteTime) {
      record.abortDelete.abort();
      return true;
    }

    return false;
  }

  containSize() {
    const timeNow = Date.now();

    let sorted = Array.from(this.pendingDeleteRecord.entries()).filter(
      (item) => {
        return (
          timeNow - item[1].deleteTime <= this.opts.maxDurationToKeepRecord
        );
      },
    );

    if (sorted.length > maxNoOfPendingRecords) {
      sorted = sorted
        .sort((a, b) => {
          return b[1].deleteTime - a[1].deleteTime;
        })
        .slice(0, maxNoOfPendingRecords);
    }

    this.pendingDeleteRecord = new Map(sorted);
  }

  destroy() {
    this.pendingDeleteRecord.forEach((item) => {
      item.abortDelete.abort();
    });
    this.pendingDeleteRecord.clear();
  }
}

function abortableSetTimeout(
  callback: () => void,
  signal: AbortSignal,
  ms: number,
): void {
  const timer = setTimeout(callback, ms);
  signal.addEventListener(
    'abort',
    () => {
      clearTimeout(timer);
    },
    { once: true },
  );
}
