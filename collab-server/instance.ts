import { Step, StepMap } from 'prosemirror-transform';
import { Schema, Node } from 'prosemirror-model';
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
  version = 0;
  steps: StepBigger[] = [];
  lastActive = Date.now();
  users = Object.create(null);
  userCount = 0;
  waiting: Array<Waiter> = [];
  collecting: number | null = null;
  lastModified = this.lastActive;

  constructor(
    public docName: string,
    public schema: Schema,
    public doc: Node = schema.node('doc', {}, [
      schema.node('paragraph', {}, [schema.text('Namaste!')]),
    ]),
    public scheduleSave: (final?: boolean) => void,
    public created: number = Date.now(),
    public collectUsersTimeout: number,
  ) {}

  stop() {
    if (this.collecting != null) {
      clearInterval(this.collecting);
      this.collecting = null;
      this.scheduleSave(true);
    }
  }

  addEvents(version: number, steps: Step[], clientID: string) {
    // TODO this checkversion is not covered
    this.checkVersion(version);

    const biggerSteps: StepBigger[] = steps.map((s) =>
      Object.assign(s, { clientID }),
    );

    if (this.version !== version) {
      // TODO returning false gives 409 but if we donot give 409 error
      // tests donot fail
      return false;
    }
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
    this.steps = this.steps.concat(biggerSteps);
    if (this.steps.length > MAX_STEP_HISTORY) {
      this.steps = this.steps.slice(this.steps.length - MAX_STEP_HISTORY);
    }

    Instance.sendUpdates(this.waiting);
    this.scheduleSave();
    return { version: this.version };
  }

  static sendUpdates(waiting: Waiter[]) {
    while (waiting.length) {
      const popped = waiting.pop();
      popped && log('sending up to user:', popped?.userId);
      popped?.onFinish();
    }
  }
  // : (Number)
  // Check if a document version number relates to an existing
  // document version.
  checkVersion(version: any) {
    if (typeof version !== 'number') {
      throw new Error('version is not a number');
    }
    if (version < 0 || version > this.version) {
      throw new CollabError(400, 'Invalid version ' + version);
    }
  }

  // : (Number, Number)
  // Get events between a given document version and
  // the current document version.
  getEvents(version: number) {
    this.checkVersion(version);
    let startIndex = this.steps.length - (this.version - version);
    if (startIndex < 0) {
      return false;
    }

    return {
      steps: this.steps.slice(startIndex),
      users: this.userCount,
    };
  }

  collectUsers() {
    const oldUserCount = this.userCount;
    this.users = Object.create(null);
    this.userCount = 0;
    this.collecting = null;
    log('collectUsers', [...Object.entries(this.users || {})]);
    log('waiting', [...this.waiting.map((r) => r.userId)]);
    for (const waiter of this.waiting) {
      this._registerUser(waiter.userId);
    }

    if (this.userCount !== oldUserCount) {
      Instance.sendUpdates(this.waiting);
    }
  }

  registerUser(userId: string) {
    log('registerUser', [...Object.entries(this.users || {})]);
    if (!(userId in this.users)) {
      this._registerUser(userId);
      Instance.sendUpdates(this.waiting);
    }
  }
  // TODO when switching docs its a good idea to kill users
  _registerUser(userId: string) {
    if (!(userId in this.users)) {
      this.users[userId] = true;
      this.userCount++;
      if (this.collecting == null) {
        this.collecting = setTimeout(
          () => this.collectUsers(),
          this.collectUsersTimeout,
        );
      }
    }
    log('_registerUser', [...Object.entries(this.users || {})]);
  }
}
