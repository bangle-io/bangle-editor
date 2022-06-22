import { Node, Step } from '@bangle.dev/pm';
import { Either } from '@bangle.dev/utils';

import { throwCollabError } from './collab-error';
import { CollabState } from './take2/collab-state';

const LOG = false;
function log(...args: any[]) {
  if (LOG) {
    console.log('collab/server/instance', ...args);
  }
}

interface Waiter {
  userId: string;
  onFinish: () => void;
}

export class Instance {
  static sendUpdates(waiting: Waiter[]) {
    while (waiting.length) {
      const popped = waiting.pop();
      popped && log('sending up to user:', popped?.userId);
      popped?.onFinish();
    }
  }

  public collabState: CollabState;
  public lastActive = Date.now();
  public userCount = 0;
  public waiting: Array<Waiter> = [];
  public abortController = new AbortController();

  private _collecting: ReturnType<typeof setTimeout> | null = null;
  private _lastSavedVersion: number;
  private _users = Object.create(null);

  constructor(
    public readonly docName: string,
    doc: Node,
    version: number = 0,
    private _scheduleSave: (final?: boolean) => void,
    private _collectUsersTimeout: number,
  ) {
    this._lastSavedVersion = version;
    log('new instance', docName, version);
    this.collabState = new CollabState(doc, [], version);
    this.abortController.signal.addEventListener(
      'abort',
      () => {
        if (this._collecting != null) {
          clearTimeout(this._collecting);
          this._collecting = null;
          Instance.sendUpdates(this.waiting);
          this._saveData(true);
        }
      },
      { once: true },
    );
  }

  public abort() {
    this.abortController.abort();
  }

  public addEvents(version: number, steps: Step[], clientID: string) {
    const [fail, collabState] = Either.unwrap(
      CollabState.addEvents(this.collabState, version, steps, clientID),
    );

    if (fail != null) {
      throwCollabError(fail);
    }

    let prevCollabState = this.collabState;
    this.collabState = collabState;

    Instance.sendUpdates(this.waiting);

    if (!prevCollabState.doc.eq(this.collabState.doc)) {
      this._saveData();
    }

    return {
      version: this.collabState.version,
    };
  }

  // the current document version.
  public getEvents(version: number) {
    const [fail, result] = Either.unwrap(
      CollabState.getEvents(this.collabState, version),
    );

    if (fail) {
      throwCollabError(fail);
    }

    return {
      steps: result.steps,
      users: this.userCount,
    };
  }

  // : (Number, Number)
  public registerUser(userId: string) {
    log('registerUser', [...Object.entries(this._users || {})]);
    if (!(userId in this._users)) {
      this._registerUser(userId);
      Instance.sendUpdates(this.waiting);
    }
  }

  // Get events between a given document version and
  private _collectUsers() {
    const oldUserCount = this.userCount;
    this._users = Object.create(null);
    this.userCount = 0;
    this._collecting = null;
    log('waiting', [...this.waiting.map((r) => r.userId)]);
    for (const waiter of this.waiting) {
      this._registerUser(waiter.userId);
    }

    if (this.userCount !== oldUserCount) {
      Instance.sendUpdates(this.waiting);
    }
  }

  // TODO when switching docs its a good idea to kill users
  private _registerUser(userId: string) {
    if (!(userId in this._users)) {
      this._users[userId] = true;
      this.userCount++;
      if (this._collecting == null) {
        this._collecting = setTimeout(
          () => this._collectUsers(),
          this._collectUsersTimeout,
        );
      }
    }
    log('_registerUser', [...Object.entries(this._users || {})]);
  }

  private _saveData(final?: boolean) {
    if (this._lastSavedVersion !== this.collabState.version) {
      this._lastSavedVersion = this.collabState.version;
      this._scheduleSave(final);
    }
  }
}
