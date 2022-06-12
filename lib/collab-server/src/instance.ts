import { Node, Schema, Step, StepMap } from '@bangle.dev/pm';

import { CollabError } from './collab-error';

const MAX_STEP_HISTORY = 1000;

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

export interface StepBigger extends Step {
  clientID: string;
}

export class Instance {
  static sendUpdates(waiting: Waiter[]) {
    while (waiting.length) {
      const popped = waiting.pop();
      popped && log('sending up to user:', popped?.userId);
      popped?.onFinish();
    }
  }

  public lastActive = Date.now();
  public userCount = 0;
  public waiting: Array<Waiter> = [];

  private _collecting: ReturnType<typeof setTimeout> | null = null;
  private _lastSavedVersion: number;

  private _steps: StepBigger[] = [];
  private _users = Object.create(null);

  constructor(
    public docName: string,
    public doc: Node,
    public version: number = 0,
    private _scheduleSave: (final?: boolean) => void,
    private _collectUsersTimeout: number,
  ) {
    this._lastSavedVersion = version;
    log('new instance', docName, version);
  }

  public addEvents(version: number, steps: Step[], clientID: string) {
    // TODO this checkversion is not covered
    this._checkVersion(version);

    const biggerSteps: StepBigger[] = steps.map((s) =>
      Object.assign(s, { clientID }),
    );

    if (this.version !== version) {
      // TODO returning false gives 409 but if we donot give 409 error
      // tests donot fail
      return false;
    }
    let previousDoc = this.doc;
    let doc = this.doc,
      maps: StepMap[] = [];

    for (const step of biggerSteps) {
      let result = step.apply(doc);
      if (result.doc == null) {
        // TODO if the apply gives error what to do?
        throw new Error('Applying failed');
      }

      doc = result.doc;
      maps.push(step.getMap());
    }
    this.doc = doc;
    this.version += biggerSteps.length;
    this._steps = this._steps.concat(biggerSteps);
    if (this._steps.length > MAX_STEP_HISTORY) {
      this._steps = this._steps.slice(this._steps.length - MAX_STEP_HISTORY);
    }
    log(this.version, version, clientID);
    Instance.sendUpdates(this.waiting);
    if (!previousDoc.eq(this.doc)) {
      this._saveData();
    }
    return { version: this.version };
  }

  // the current document version.
  public getEvents(version: number) {
    this._checkVersion(version);
    let startIndex = this._steps.length - (this.version - version);
    if (startIndex < 0) {
      return false;
    }

    return {
      steps: this._steps.slice(startIndex),
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

  public stop() {
    if (this._collecting != null) {
      clearTimeout(this._collecting);
      this._collecting = null;
      Instance.sendUpdates(this.waiting);
      this._saveData(true);
    }
  }

  // document version.
  private _checkVersion(version: any) {
    if (typeof version !== 'number') {
      throw new Error('version is not a number');
    }
    if (version < 0 || version > this.version) {
      throw new CollabError(400, 'Invalid version ' + version);
    }
  }

  // Get events between a given document version and
  private _collectUsers() {
    const oldUserCount = this.userCount;
    this._users = Object.create(null);
    this.userCount = 0;
    this._collecting = null;
    log('collectUsers', [...Object.entries(this._users || {})]);
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
    if (this._lastSavedVersion !== this.version) {
      this._lastSavedVersion = this.version;
      this._scheduleSave(final);
    }
  }

  // : (Number)
  // Check if a document version number relates to an existing
}
